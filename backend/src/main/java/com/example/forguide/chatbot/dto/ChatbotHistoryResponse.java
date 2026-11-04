package com.example.forguide.chatbot.dto;

import java.util.List;

/**
 * 챗봇 화면을 열 때 받는 내용.
 *
 * @param available      false면 서버에 OpenAI 키가 없어 챗봇을 쓸 수 없다
 * @param dailyLimit     하루 질문 한도
 * @param remainingToday 오늘 남은 질문 수
 * @param maxQuestionLength 질문 최대 글자 수
 * @param messages       최근 대화 (오래된 순)
 */
public record ChatbotHistoryResponse(
        boolean available,
        int dailyLimit,
        int remainingToday,
        int maxQuestionLength,
        List<ChatbotMessageResponse> messages
) {
}
