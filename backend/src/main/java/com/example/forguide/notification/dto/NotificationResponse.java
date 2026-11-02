package com.example.forguide.notification.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationResponse {

    private Long notificationId;

    // 인기 순위 알림은 시스템이 보내므로 null일 수 있다.
    private Long actorMemberId;
    private String actorNickname;
    private String actorProfileImageUrl;

    // POST_LIKED, COMMENT_MENTIONED, POPULAR_TOP_3 등
    private String notificationType;
    private String resourceType;
    private Long resourceId;

    // 인기 알림이 아니면 null
    private Integer rankPosition;

    // null 이면 읽지 않은 알림
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
