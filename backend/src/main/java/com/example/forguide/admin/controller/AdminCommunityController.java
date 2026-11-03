package com.example.forguide.admin.controller;

import com.example.forguide.admin.dto.AdminCommunityContentCursorRequest;
import com.example.forguide.admin.dto.AdminCommunityContentResponse;
import com.example.forguide.admin.dto.AdminCommunityModerationUpdateRequest;
import com.example.forguide.admin.dto.AdminCommunityResourceType;
import com.example.forguide.admin.service.AdminCommunityService;
import com.example.forguide.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/community")
@RequiredArgsConstructor
public class AdminCommunityController {

    private final AdminCommunityService adminCommunityService;

    // 관리자만 게시글,댓글 통합 목록을 조회할 수 있다.
    @GetMapping("/contents")
    public ApiResponse<List<AdminCommunityContentResponse>> getContents(
            @Valid @ModelAttribute AdminCommunityContentCursorRequest cursor
    ) {
        return ApiResponse.ok(adminCommunityService.getContents(cursor));
    }

    //SecurityConfig의 /api/v1/admin/** 규칙이 관리자 권한을 먼저 검증한다.
    @PatchMapping("/contents/{resourceType}/{resourceId}/moderation")
    public ApiResponse<AdminCommunityContentResponse> updateModeration(
            @AuthenticationPrincipal Long adminMemberId,
            @PathVariable AdminCommunityResourceType resourceType,
            @PathVariable Long resourceId,
            @Valid @RequestBody AdminCommunityModerationUpdateRequest request
    ) {
        return ApiResponse.ok(
                adminCommunityService.updateModeration(
                        adminMemberId,
                        resourceType,
                        resourceId,
                        request.moderationStatus(),
                        request.reason()
                )
        );
    }
}
