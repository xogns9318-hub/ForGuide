package com.example.forguide.notification.dto;

import lombok.Getter;
import lombok.Setter;

// 기능 서비스가 NotificationService에 전달하는 내부 알림 생성 정보
@Getter
public class NotificationCreateCommand {

    // MyBatis INSERT 뒤 DB가 생성한 notification_id를 넣는다.
    @Setter
    private Long notificationId;

    private final Long recipientMemberId;
    private final Long actorMemberId;
    private final NotificationType notificationType;
    private final NotificationResourceType resourceType;
    private final Long resourceId;
    private final Integer rankPosition;
    private final String notificationEventKey;

    public NotificationCreateCommand(
            Long recipientMemberId,
            Long actorMemberId,
            NotificationType notificationType,
            NotificationResourceType resourceType,
            Long resourceId,
            Integer rankPosition,
            String notificationEventKey
    ) {
        if (recipientMemberId == null || recipientMemberId < 1) {
            throw new IllegalArgumentException("알림 수신 회원 번호가 올바르지 않습니다.");
        }

        if (notificationType == null) {
            throw new IllegalArgumentException("알림 종류가 필요합니다.");
        }

        if (resourceType == null) {
            throw new IllegalArgumentException("알림 대상 종류가 필요합니다.");
        }

        if (resourceId == null || resourceId < 1) {
            throw new IllegalArgumentException("알림 대상 번호가 올바르지 않습니다.");
        }

        if (rankPosition != null && rankPosition < 1) {
            throw new IllegalArgumentException("인기 순위는 1 이상이어야 합니다.");
        }

        this.recipientMemberId = recipientMemberId;
        this.actorMemberId = actorMemberId;
        this.notificationType = notificationType;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.rankPosition = rankPosition;
        this.notificationEventKey =
                notificationEventKey == null || notificationEventKey.isBlank()
                        ? null
                        : notificationEventKey;
    }
}