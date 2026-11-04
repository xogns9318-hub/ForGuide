package com.example.forguide.notification.dto;

// DB notification_type에 저장할 커뮤니티 알림 종류
public enum NotificationType {

    POST_LIKED,
    POST_UNLIKED,
    POST_REPOSTED,
    POST_UNREPOSTED,

    POST_COMMENTED,
    COMMENT_REPLIED,
    COMMENT_MENTIONED,

    POPULAR_TOP_10,
    POPULAR_TOP_3,
    POPULAR_TOP_2,
    POPULAR_TOP_1,

    REPORT_HIDDEN,
    REPORT_DISMISSED
}
