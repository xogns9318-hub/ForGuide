package com.example.forguide.notification.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "forguide.notification")
public record NotificationProperties(
        Duration sseTimeout,
        int sseMaxConnectionsPerMember,
        Duration sseHeartbeatInterval
) {
    public NotificationProperties {
        if (sseTimeout == null || sseTimeout.isZero() || sseTimeout.isNegative()) {
            sseTimeout = Duration.ofMinutes(30);
        }

        if (sseMaxConnectionsPerMember < 1) {
            sseMaxConnectionsPerMember = 5;
        }

        if (sseHeartbeatInterval == null
                || sseHeartbeatInterval.isZero()
                || sseHeartbeatInterval.isNegative()) {
            sseHeartbeatInterval = Duration.ofSeconds(15);
        }
    }
}
