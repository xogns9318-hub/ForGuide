package com.example.forguide.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "forguide.notification")
public record NotificationProperties(
        Duration sseTimeout
) {
    public NotificationProperties {
        if (sseTimeout == null || sseTimeout.isZero() || sseTimeout.isNegative()) {
            sseTimeout = Duration.ofMinutes(30);
        }
    }
}