package com.example.forguide.translation.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "forguide.translation.gemini")
public record GeminiProperties(
        String apiKey,
        String model
) {

    public GeminiProperties {
        if (apiKey == null) {
            apiKey = "";
        }

        if (model == null || model.isBlank()) {
            model = "gemini-3.1-flash-lite";
        }
    }
}