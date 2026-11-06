package com.example.forguide.admin.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminCommunityContentResponse {

    private AdminCommunityResourceType resourceType;
    private Long resourceId;

    private Long authorMemberId;
    private String authorLoginId;
    private String authorNickname;

    private String content;
    private String sourceLanguage;
    private Integer contentVersion;
    private LocalDateTime createdAt;

    // 관리 기록이 아직 없으면 SQL에서 VISIBLE로 채운다.
    private AdminCommunityModerationStatus moderationStatus;
    private String moderationReason;
    private Long moderatedByMemberId;
    private LocalDateTime moderatedAt;
}