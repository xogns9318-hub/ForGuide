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

/**
 * OpenAI 대신 쓰는 가짜 대화 모델. 실제 호출 없이 받은 프롬프트를 기록하고 정해 둔 답을 돌려준다.
 */
class FakeChatModel implements ChatModel {

    static final String ANSWER = "예시 답변입니다.";

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

    /** 마지막 호출에서 OpenAI로 갔을 전체 내용 (시스템 프롬프트·이전 대화·질문) */
    String lastPromptText() {
        return prompts.get(prompts.size() - 1).getInstructions().stream()
                .map(Message::getText)
                .collect(Collectors.joining("\n"));
    }
}
