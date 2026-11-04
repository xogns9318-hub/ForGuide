package com.example.forguide.admin.controller;

import com.example.forguide.admin.dto.AdminCommunityContentCursorRequest;
import com.example.forguide.admin.dto.AdminCommunityContentResponse;
import com.example.forguide.admin.dto.AdminCommunityModerationUpdateRequest;
import com.example.forguide.admin.dto.AdminCommunityResourceType;
import com.example.forguide.admin.service.AdminCommunityService;
import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.community.report.CommunityReportImageResponse;
import com.example.forguide.community.report.CommunityReportService;
import com.example.forguide.admin.dto.AdminCommunityReportResponse;
import java.nio.file.Path;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
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
    private final CommunityReportService communityReportService;

    // 관리자만 게시글,댓글 통합 목록을 조회할 수 있다.
    @GetMapping("/contents")
    public ApiResponse<List<AdminCommunityContentResponse>> getContents(
            @Valid @ModelAttribute AdminCommunityContentCursorRequest cursor
    ) {
        return ApiResponse.ok(adminCommunityService.getContents(cursor));
    }

    @GetMapping("/reports")
    public ApiResponse<List<AdminCommunityReportResponse>> getRecentReports() {
        return ApiResponse.ok(adminCommunityService.getRecentReports());
    }

    // 관리자가 신고 한 건을 기각한다. 콘텐츠 공개 상태는 변경하지 않는다.
    @PatchMapping("/reports/{reportId}/dismiss")
    public ApiResponse<Void> dismissReport(
            @AuthenticationPrincipal Long adminMemberId,
            @PathVariable Long reportId
    ) {
        adminCommunityService.dismissReport(adminMemberId, reportId);
        return ApiResponse.ok();
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

    // 신고 증빙 목록은 관리자 권한이 확인된 이 경로에서만 조회한다.
    @GetMapping("/reports/{reportId}/images")
    public ApiResponse<List<CommunityReportImageResponse>> getReportImages(
            @PathVariable Long reportId
    ) {
        return ApiResponse.ok(
                communityReportService.getReportImagesForAdmin(reportId)
        );
    }

    // 신고 증빙 파일은 관리자 권한이 확인된 이 경로에서만 조회한다.
    @GetMapping("/reports/{reportId}/images/{reportImageId}")
    public ResponseEntity<Resource> getReportImage(
            @PathVariable Long reportId,
            @PathVariable Long reportImageId
    ) {
        Path imagePath = communityReportService.getReportImageForAdmin(
                reportId,
                reportImageId
        );

        return ResponseEntity.ok()
                .contentType(
                        MediaTypeFactory
                                .getMediaType(imagePath.getFileName().toString())
                                .orElse(MediaType.APPLICATION_OCTET_STREAM)
                )
                .body(new FileSystemResource(imagePath));
    }
}
