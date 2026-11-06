package com.example.forguide.admin.service;

import com.example.forguide.admin.dto.*;
import com.example.forguide.admin.mapper.AdminCommunityMapper;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.community.report.CommunityReportMapper;
import com.example.forguide.community.report.CommunityReportRecipient;
import com.example.forguide.community.report.CommunityReportStatus;
import com.example.forguide.notification.dto.NotificationCreateCommand;
import com.example.forguide.notification.dto.NotificationResourceType;
import com.example.forguide.notification.dto.NotificationType;
import com.example.forguide.notification.service.NotificationService;
import com.example.forguide.community.report.CommunityReportResourceType;
import com.example.forguide.admin.dto.AdminCommunityReportResponse;
import com.example.forguide.translation.cache.TranslationCacheResource;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import com.example.forguide.translation.service.TranslationService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminCommunityService {

    private final AdminCommunityMapper adminCommunityMapper;
    private final CommunityReportMapper communityReportMapper;
    private final NotificationService notificationService;
    private final TranslationService translationService;

    public List<AdminCommunityContentResponse> getContents(
            AdminCommunityContentCursorRequest cursor
    ) {
        cursor.setKeyword(normalizeKeyword(cursor.getKeyword()));

        return adminCommunityMapper.findContentsByCursor(cursor);
    }

    public TranslationResponse translateContent(
            AdminCommunityResourceType resourceType,
            Long resourceId,
            String targetLanguage
    ) {
        requireResource(resourceType, resourceId);

        AdminCommunityContentResponse content =
                adminCommunityMapper.findContentByResource(
                        resourceType, resourceId
                );

        if (content == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "번역할 커뮤니티 콘텐츠를 찾을 수 없습니다."
            );
        }

        if (content.getContent() == null
                || content.getContent().isBlank()) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "번역할 내용이 없습니다."
            );
        }

        TranslationRequest request = new TranslationRequest();
        request.setSourceLanguage(content.getSourceLanguage());
        request.setTargetLanguage(targetLanguage);
        request.setSourceText(content.getContent());

        String cacheType = switch (resourceType) {
            case POST -> "community-post";
            case COMMENT -> "community-comment";
        };

        return translationService.translatePublicText(
                request,
                new TranslationCacheResource(
                        cacheType,
                        resourceId,
                        content.getContentVersion()
                )
        );
    }

    public List<AdminCommunityReportResponse> getRecentReports() {
        return adminCommunityMapper.findRecentReports();
    }

    /*
     * 콘텐츠 존재 확인 → 상태 저장 → 변경 결과 조회는 한 작업 단위다.
     * 중간 실패 시 상태 변경이 남지 않도록 트랜잭션으로 묶는다.
     */
    @Transactional
    public AdminCommunityContentResponse updateModeration(
            Long adminMemberId,
            AdminCommunityResourceType resourceType,
            Long resourceId,
            AdminCommunityModerationStatus moderationStatus,
            String reason
    ) {
        requireAdminMemberId(adminMemberId);
        requireResource(resourceType, resourceId);

        AdminCommunityContentResponse content =
                adminCommunityMapper.findContentByResource(
                        resourceType, resourceId
                );

        if (content == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "관리할 커뮤니티 콘텐츠를 찾을 수 없습니다."
            );
        }

        adminCommunityMapper.upsertModeration(
                resourceType, resourceId, moderationStatus,
                moderationStatus == AdminCommunityModerationStatus.HIDDEN
                        ? normalizeReason(reason)
                        : null,
                adminMemberId
        );

        processPendingReports(
                adminMemberId,
                resourceType,
                resourceId,
                moderationStatus
        );

        return adminCommunityMapper.findContentByResource(
                resourceType, resourceId
        );
    }

    /*
     * 신고 한 건만 기각한다.
     * 콘텐츠 공개 상태는 바꾸지 않으므로 다른 신고의 처리 결과를 건드리지 않는다.
     */
    @Transactional
    public void dismissReport(Long adminMemberId, Long reportId) {
        requireAdminMemberId(adminMemberId);

        if (reportId == null || reportId < 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "올바른 신고 번호가 아닙니다."
            );
        }

        CommunityReportRecipient report =
                communityReportMapper.findPendingRecipientByReportId(reportId);

        if (report == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "처리할 신고를 찾을 수 없습니다."
            );
        }

        int updatedCount = communityReportMapper.updateStatusIfPending(
                report.reportId(),
                CommunityReportStatus.DISMISSED,
                adminMemberId
        );

        // 다른 관리자가 먼저 처리한 경우에는 중복 알림을 만들지 않는다.
        if (updatedCount != 1) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "이미 처리되었거나 찾을 수 없는 신고입니다."
            );
        }

        notificationService.createNotification(
                new NotificationCreateCommand(
                        report.reporterMemberId(),
                        adminMemberId,
                        NotificationType.REPORT_DISMISSED,
                        toNotificationResourceType(report.resourceType()),
                        report.resourceId(),
                        null,
                        "report:"
                                + report.reportId()
                                + ":"
                                + CommunityReportStatus.DISMISSED
                )
        );
    }

    private void requireAdminMemberId(Long adminMemberId) {
        if (adminMemberId == null || adminMemberId < 1) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
    }

    private void requireResource(
            AdminCommunityResourceType resourceType,
            Long resourceId
    ) {
        if (resourceType == null || resourceId == null || resourceId < 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "관리할 커뮤니티 콘텐츠 정보가 올바르지 않습니다."
            );
        }
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }

        String normalized = keyword.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeReason(String reason) {
        if (reason == null) {
            return null;
        }

        String normalized = reason.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    // 관리자 공개 상태 변경에 맞춰 아직 처리되지 않은 신고만 처리한다.
    private void processPendingReports(
            Long adminMemberId,
            AdminCommunityResourceType resourceType,
            Long resourceId,
            AdminCommunityModerationStatus moderationStatus
    ) {
        CommunityReportStatus reportStatus =
                moderationStatus == AdminCommunityModerationStatus.HIDDEN
                        ? CommunityReportStatus.HIDDEN
                        : CommunityReportStatus.DISMISSED;

        List<CommunityReportRecipient> reports =
                communityReportMapper.findPendingRecipientsByResource(
                        toReportResourceType(resourceType),
                        resourceId
                );

        for (CommunityReportRecipient report : reports) {
            int updatedCount = communityReportMapper.updateStatusIfPending(
                    report.reportId(),
                    reportStatus,
                    adminMemberId
            );

            // 다른 관리자가 먼저 처리했다면 알림도 만들지 않는다.
            if (updatedCount != 1) {
                continue;
            }

            notificationService.createNotification(
                    new NotificationCreateCommand(
                            report.reporterMemberId(),
                            adminMemberId,
                            toNotificationType(reportStatus),
                            toNotificationResourceType(resourceType),
                            resourceId,
                            null,
                            "report:"
                                    + report.reportId()
                                    + ":"
                                    + reportStatus
                    )
            );
        }
    }

    private CommunityReportResourceType toReportResourceType(
            AdminCommunityResourceType resourceType
    ) {
        return switch (resourceType) {
            case POST -> CommunityReportResourceType.POST;
            case COMMENT -> CommunityReportResourceType.COMMENT;
        };
    }

    private NotificationResourceType toNotificationResourceType(
            AdminCommunityResourceType resourceType
    ) {
        return switch (resourceType) {
            case POST -> NotificationResourceType.COMMUNITY_POST;
            case COMMENT -> NotificationResourceType.COMMUNITY_COMMENT;
        };
    }

    private NotificationResourceType toNotificationResourceType(
            CommunityReportResourceType resourceType
    ) {
        return switch (resourceType) {
            case POST -> NotificationResourceType.COMMUNITY_POST;
            case COMMENT -> NotificationResourceType.COMMUNITY_COMMENT;
        };
    }

    private NotificationType toNotificationType(
            CommunityReportStatus reportStatus
    ) {
        return switch (reportStatus) {
            case HIDDEN -> NotificationType.REPORT_HIDDEN;
            case DISMISSED -> NotificationType.REPORT_DISMISSED;
            case PENDING -> throw new IllegalArgumentException(
                    "처리되지 않은 신고 상태에는 알림을 만들 수 없습니다."
            );
        };
    }
}
