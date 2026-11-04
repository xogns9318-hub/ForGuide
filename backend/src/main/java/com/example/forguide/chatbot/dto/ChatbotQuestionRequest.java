package com.example.forguide.chatbot.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 챗봇 질문. 글자 수 제한은 설정값(forguide.chatbot.max-question-length)이라 서비스에서 검사한다.
 *
 * @param question 질문 내용
 * @param language 화면 언어 코드 (ko·en·zh·ja·vi·th). 질문 언어를 알 수 없을 때 이 언어로 답한다
 */
public record ChatbotQuestionRequest(
        @NotBlank(message = "질문을 입력해주세요.")
        String question,
        String language
) {
}
