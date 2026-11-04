package com.example.forguide.chatbot.dto;

/**
 * 대화 메시지 하나.
 *
 * @param role    USER(질문) 또는 ASSISTANT(답변)
 * @param content 내용. 질문은 개인정보를 가린 뒤의 내용이다
 */
public record ChatbotMessageResponse(String role, String content) {

    public static final String USER = "USER";
    public static final String ASSISTANT = "ASSISTANT";
}
