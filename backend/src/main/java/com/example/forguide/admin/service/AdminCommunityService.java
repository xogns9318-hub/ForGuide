package com.example.forguide.admin.service;

import com.example.forguide.admin.dto.AdminCommunityContentCursorRequest;
import com.example.forguide.admin.dto.AdminCommunityContentResponse;
import com.example.forguide.admin.dto.AdminCommunityModerationStatus;
import com.example.forguide.admin.dto.AdminCommunityResourceType;
import com.example.forguide.admin.mapper.AdminCommunityMapper;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminCommunityService {

    private final AdminCommunityMapper adminCommunityMapper;

    public List<AdminCommunityContentResponse> getContents(
            AdminCommunityContentCursorRequest cursor
    ) {
        cursor.setKeyword(normalizeKeyword(cursor.getKeyword()));

        return adminCommunityMapper.findContentsByCursor(cursor);
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

        return adminCommunityMapper.findContentByResource(
                resourceType, resourceId
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
}
