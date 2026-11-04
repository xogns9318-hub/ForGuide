package com.example.forguide.chatbot.config;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ChatbotProperties.class)
public class ChatbotConfig {

    /**
     * 회원별 최근 대화 기억. 서버 메모리에만 두므로 서버를 다시 켜면 비워진다 (DB 테이블 없음).
     * 오래된 메시지는 memorySize를 넘는 순서대로 밀려난다.
     */
    @Bean
    public ChatMemory chatbotChatMemory(ChatbotProperties properties) {
        return MessageWindowChatMemory.builder()
                .chatMemoryRepository(new InMemoryChatMemoryRepository())
                .maxMessages(properties.memorySize())
                .build();
    }
}
