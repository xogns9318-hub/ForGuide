package com.example.forguide.chatbot.service;

import com.example.forguide.chatbot.config.ChatbotProperties;
import com.example.forguide.chatbot.dto.ChatbotHistoryResponse;
import com.example.forguide.chatbot.dto.ChatbotMessageResponse;
import com.example.forguide.chatbot.dto.ChatbotQuestionRequest;
import com.example.forguide.chatbot.dto.ChatbotReplyResponse;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

/**
 * 문의 챗봇. 화면 → 이 서비스 → OpenAI 순서로만 호출한다 (React는 OpenAI를 직접 부르지 않는다).
 *
 * 질문 한 번의 흐름:
 * 키 확인 → 글자 수 확인 → 하루 횟수 1회 차감 → 개인정보 가리기 → OpenAI 호출(최근 대화 함께) → 답변 반환
 * OpenAI 호출이 실패하면 차감한 횟수를 되돌린다.
 */
@Slf4j
@Service
public class ChatbotService {

    /** application.properties에서 키가 비었을 때 넣는 값 */
    static final String NO_KEY = "no-key";

    /** 하루의 기준은 한국 시간 자정 */
    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private final ChatbotContext chatbotContext;
    private final PiiMasker piiMasker;
    private final ChatbotProperties properties;
    private final boolean available;

    /** 회원 번호 → 오늘 사용 횟수. 서버 메모리에만 두므로 서버를 다시 켜면 초기화된다 */
    private final Map<Long, DailyUsage> usages = new ConcurrentHashMap<>();

    public ChatbotService(
            ChatClient.Builder chatClientBuilder,
            ChatMemory chatMemory,
            ChatbotContext chatbotContext,
            PiiMasker piiMasker,
            ChatbotProperties properties,
            @Value("${spring.ai.openai.api-key:" + NO_KEY + "}") String apiKey
    ) {
        this.chatMemory = chatMemory;
        this.chatbotContext = chatbotContext;
        this.piiMasker = piiMasker;
        this.properties = properties;
        // 키가 없으면 서버는 그대로 켜고 챗봇만 끈다
        this.available = apiKey != null && !apiKey.isBlank() && !NO_KEY.equals(apiKey);
        // 최근 대화를 기억해 함께 보내는 advisor를 기본으로 붙인다 (대화 구분은 요청마다 회원 번호로)
        this.chatClient = chatClientBuilder
                .defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .build();

        if (!available) {
            log.warn("FORGUIDE_OPENAI_API_KEY가 없어 챗봇을 끈 상태로 시작합니다.");
        }
    }

    /** 화면을 열 때: 사용 가능 여부·남은 횟수·최근 대화 */
    public ChatbotHistoryResponse getHistory(Long memberId) {
        requireLogin(memberId);

        List<ChatbotMessageResponse> messages = chatMemory.get(conversationId(memberId)).stream()
                .filter(message -> message.getMessageType() == MessageType.USER
                        || message.getMessageType() == MessageType.ASSISTANT)
                .map(this::toResponse)
                .toList();

        return new ChatbotHistoryResponse(
                available,
                properties.dailyLimit(),
                remainingToday(memberId),
                properties.maxQuestionLength(),
                messages
        );
    }

    public ChatbotReplyResponse ask(Long memberId, ChatbotQuestionRequest request) {
        PreparedQuestion prepared = prepare(memberId, request);

        String answer;
        try {
            answer = prompt(memberId, prepared).call().content();
        } catch (RuntimeException exception) {
            undo(memberId, prepared);
            // 질문 내용은 로그에 남기지 않는다
            log.warn("챗봇 답변 실패 memberId={}: {}", memberId, exception.getClass().getSimpleName());
            throw new ApiException(ErrorCode.CHATBOT_FAILED);
        }

        if (answer == null || answer.isBlank()) {
            undo(memberId, prepared);
            throw new ApiException(ErrorCode.CHATBOT_FAILED);
        }

        return new ChatbotReplyResponse(
                new ChatbotMessageResponse(ChatbotMessageResponse.USER, prepared.maskedQuestion()),
                new ChatbotMessageResponse(ChatbotMessageResponse.ASSISTANT, answer),
                prepared.remaining()
        );
    }

    /**
     * 답변을 받는 대로 조금씩 보낸다 (SSE).
     *
     * 이벤트 순서: start(가린 질문·남은 횟수) → delta(글자 조각) 여러 번 → done
     * 중간에 실패하거나 시간이 지나거나 사용자가 연결을 끊으면 error를 보내고(가능하면),
     * 차감한 횟수와 답 없는 질문을 되돌린다. 받다 만 답변은 대화 기록에 남지 않는다.
     * 로그인·글자 수·하루 횟수 확인은 연결을 열기 전에 해서, 그 오류는 지금처럼 JSON으로 간다.
     */
    public SseEmitter askStream(Long memberId, ChatbotQuestionRequest request) {
        PreparedQuestion prepared = prepare(memberId, request);
        SseEmitter emitter = new SseEmitter(properties.streamTimeout().toMillis());
        StringBuilder answer = new StringBuilder();
        AtomicBoolean finished = new AtomicBoolean(false);
        AtomicReference<Disposable> subscription = new AtomicReference<>();

        Runnable fail = () -> {
            if (!finished.compareAndSet(false, true)) {
                return;
            }
            Disposable running = subscription.get();
            if (running != null) {
                running.dispose();
            }
            undo(memberId, prepared);
            send(emitter, "error", Map.of(
                    "code", ErrorCode.CHATBOT_FAILED.name(),
                    "message", ErrorCode.CHATBOT_FAILED.getDefaultMessage()
            ));
            emitter.complete();
        };

        emitter.onTimeout(fail);
        emitter.onError(error -> fail.run());
        // 사용자가 화면을 떠나 연결이 끊긴 경우도 실패와 같이 되돌린다
        emitter.onCompletion(fail);

        send(emitter, "start", Map.of(
                "question", new ChatbotMessageResponse(ChatbotMessageResponse.USER, prepared.maskedQuestion()),
                "remainingToday", prepared.remaining()
        ));

        try {
            Disposable running = prompt(memberId, prepared).stream().content()
                    .filter(chunk -> chunk != null && !chunk.isEmpty())
                    .subscribe(
                            chunk -> {
                                if (finished.get()) {
                                    return;
                                }
                                answer.append(chunk);
                                if (!send(emitter, "delta", Map.of("text", chunk))) {
                                    fail.run();
                                }
                            },
                            error -> {
                                log.warn("챗봇 답변 실패 memberId={}: {}", memberId, error.getClass().getSimpleName());
                                fail.run();
                            },
                            () -> {
                                if (answer.toString().isBlank()) {
                                    fail.run();
                                } else if (finished.compareAndSet(false, true)) {
                                    send(emitter, "done", Map.of("remainingToday", prepared.remaining()));
                                    emitter.complete();
                                }
                            }
                    );
            subscription.set(running);
            if (finished.get()) {
                running.dispose();
            }
        } catch (RuntimeException exception) {
            log.warn("챗봇 답변 실패 memberId={}: {}", memberId, exception.getClass().getSimpleName());
            fail.run();
        }

        return emitter;
    }

    /** 키·글자 수 확인, 하루 횟수 1회 차감, 개인정보 가리기 (일반 답변과 이어서 받기 공통) */
    private PreparedQuestion prepare(Long memberId, ChatbotQuestionRequest request) {
        requireLogin(memberId);

        if (!available) {
            throw new ApiException(ErrorCode.CHATBOT_UNAVAILABLE);
        }

        String question = request.question().strip();
        // 이모지 등도 한 글자로 세도록 code point 기준으로 센다
        if (question.codePointCount(0, question.length()) > properties.maxQuestionLength()) {
            throw new ApiException(
                    ErrorCode.CHATBOT_QUESTION_TOO_LONG,
                    "질문은 " + properties.maxQuestionLength() + "자 이하로 입력해주세요."
            );
        }

        // 횟수를 먼저 차감해 같은 회원이 동시에 여러 번 보내도 한도를 넘지 않게 한다
        int remaining = useOne(memberId);
        return new PreparedQuestion(
                piiMasker.mask(question),
                chatbotContext.normalizeLanguage(request.language()),
                remaining
        );
    }

    private ChatClient.ChatClientRequestSpec prompt(Long memberId, PreparedQuestion prepared) {
        return chatClient.prompt()
                .system(chatbotContext.systemPrompt(prepared.language()))
                .user(prepared.maskedQuestion())
                .advisors(advisor -> advisor.param(ChatMemory.CONVERSATION_ID, conversationId(memberId)));
    }

    /** 답을 못 받았을 때: 횟수를 돌려주고 답 없는 질문을 기록에서 뺀다 */
    private void undo(Long memberId, PreparedQuestion prepared) {
        refundOne(memberId);
        removeUnansweredQuestion(memberId, prepared.maskedQuestion());
    }

    /** 연결이 이미 끊겼으면 false. 끊긴 연결에 보내다 생긴 오류는 밖으로 던지지 않는다 */
    private boolean send(SseEmitter emitter, String name, Object data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data, MediaType.APPLICATION_JSON));
            return true;
        } catch (IOException | IllegalStateException exception) {
            return false;
        }
    }

    /** 대화 지우기. 오늘 사용 횟수는 되돌리지 않는다 */
    public void clearHistory(Long memberId) {
        requireLogin(memberId);
        chatMemory.clear(conversationId(memberId));
    }

    /**
     * 대화 기억 advisor는 OpenAI를 부르기 전에 질문을 먼저 저장한다.
     * 답변을 못 받았으면 그 질문만 빼서, 새로고침했을 때 답 없는 질문이 남지 않게 한다.
     */
    private void removeUnansweredQuestion(Long memberId, String maskedQuestion) {
        String conversationId = conversationId(memberId);
        List<Message> messages = chatMemory.get(conversationId);

        if (messages.isEmpty()) {
            return;
        }

        Message last = messages.get(messages.size() - 1);
        if (last.getMessageType() == MessageType.USER && maskedQuestion.equals(last.getText())) {
            chatMemory.clear(conversationId);
            if (messages.size() > 1) {
                chatMemory.add(conversationId, messages.subList(0, messages.size() - 1));
            }
        }
    }

    private ChatbotMessageResponse toResponse(Message message) {
        String role = message.getMessageType() == MessageType.USER
                ? ChatbotMessageResponse.USER
                : ChatbotMessageResponse.ASSISTANT;
        return new ChatbotMessageResponse(role, message.getText());
    }

    /** 오늘 횟수를 1 쓰고 남은 횟수를 돌려준다. 한도를 넘으면 차감하지 않고 거절한다 */
    private int useOne(Long memberId) {
        LocalDate today = today();
        DailyUsage updated = usages.compute(memberId, (id, usage) -> {
            int used = usage != null && usage.date().equals(today) ? usage.count() : 0;
            if (used >= properties.dailyLimit()) {
                throw new ApiException(ErrorCode.CHATBOT_DAILY_LIMIT);
            }
            return new DailyUsage(today, used + 1);
        });
        return properties.dailyLimit() - updated.count();
    }

    private void refundOne(Long memberId) {
        LocalDate today = today();
        usages.computeIfPresent(memberId, (id, usage) -> usage.date().equals(today) && usage.count() > 0
                ? new DailyUsage(today, usage.count() - 1)
                : usage);
    }

    private int remainingToday(Long memberId) {
        DailyUsage usage = usages.get(memberId);
        int used = usage != null && usage.date().equals(today()) ? usage.count() : 0;
        return Math.max(0, properties.dailyLimit() - used);
    }

    private LocalDate today() {
        return LocalDate.now(SERVICE_ZONE);
    }

    private String conversationId(Long memberId) {
        return "member-" + memberId;
    }

    // Security가 로그인 없는 요청을 먼저 막지만, 서비스만 따로 불릴 때를 대비해 한 번 더 확인한다
    private void requireLogin(Long memberId) {
        if (memberId == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
    }

    private record DailyUsage(LocalDate date, int count) {
    }

    private record PreparedQuestion(String maskedQuestion, String language, int remaining) {
    }
}
