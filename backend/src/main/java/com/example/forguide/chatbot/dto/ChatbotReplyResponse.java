package com.example.forguide.chatbot.dto;

/**
 * 질문 한 번의 결과.
 *
 * @param question       개인정보를 가린 질문 (화면에 이 내용으로 다시 그린다)
 * @param answer         챗봇 답변
 * @param remainingToday 오늘 남은 질문 수
 */
public record ChatbotReplyResponse(
        ChatbotMessageResponse question,
        ChatbotMessageResponse answer,
        int remainingToday
) {
}
