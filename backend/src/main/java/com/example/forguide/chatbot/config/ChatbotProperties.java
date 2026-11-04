package com.example.forguide.chatbot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 챗봇 사용 제한 설정 (application.properties의 forguide.chatbot.*)
 *
 * @param dailyLimit        회원 한 명이 하루에 보낼 수 있는 질문 수
 * @param maxQuestionLength 질문 한 개의 최대 글자 수
 * @param memorySize        OpenAI에 함께 보내고 화면에 다시 보여 줄 최근 메시지 수 (질문·답변 각각 1개)
 */
@ConfigurationProperties(prefix = "forguide.chatbot")
public record ChatbotProperties(
        int dailyLimit,
        int maxQuestionLength,
        int memorySize
) {

    public ChatbotProperties {
        if (dailyLimit <= 0) {
            dailyLimit = 30;
        }

        if (maxQuestionLength <= 0) {
            maxQuestionLength = 500;
        }

        if (memorySize <= 0) {
            memorySize = 10;
        }
    }
}
