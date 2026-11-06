package com.example.forguide.chatbot;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import reactor.core.publisher.Flux;

/**
 * OpenAI 대신 쓰는 가짜 대화 모델. 실제 호출 없이 받은 프롬프트를 기록하고 정해 둔 답을 돌려준다.
 */
class FakeChatModel implements ChatModel {

    static final String ANSWER = "예시 답변입니다.";
    /** 띄어쓰기로 시작하는 조각도 그대로 이어 붙는지 보기 위해 두 번째 조각을 공백으로 시작한다 */
    static final List<String> STREAM_CHUNKS = List.of("예시", " 답변입니다.");

    final List<Prompt> prompts = new ArrayList<>();
    RuntimeException nextFailure;

    @Override
    public ChatResponse call(Prompt prompt) {
        prompts.add(prompt);

        if (nextFailure != null) {
            RuntimeException failure = nextFailure;
            nextFailure = null;
            throw failure;
        }

        return new ChatResponse(List.of(new Generation(new AssistantMessage(ANSWER))));
    }

    /** 이어서 받기: ANSWER를 두 조각으로 나눠 보낸다. 실패를 정해 두면 첫 조각 다음에 끊는다 */
    @Override
    public Flux<ChatResponse> stream(Prompt prompt) {
        prompts.add(prompt);
        Flux<ChatResponse> first = Flux.just(chunk(STREAM_CHUNKS.get(0)));

        if (nextFailure != null) {
            RuntimeException failure = nextFailure;
            nextFailure = null;
            return first.concatWith(Flux.error(failure));
        }

        return first.concatWith(Flux.just(chunk(STREAM_CHUNKS.get(1))));
    }

    private static ChatResponse chunk(String text) {
        return new ChatResponse(List.of(new Generation(new AssistantMessage(text))));
    }

    /** 마지막 호출에서 OpenAI로 갔을 전체 내용 (시스템 프롬프트·이전 대화·질문) */
    String lastPromptText() {
        return prompts.get(prompts.size() - 1).getInstructions().stream()
                .map(Message::getText)
                .collect(Collectors.joining("\n"));
    }
}
