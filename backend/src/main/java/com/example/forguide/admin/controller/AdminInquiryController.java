package com.example.forguide.admin.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.inquiry.dto.InquiryAnswerRequest;
import com.example.forguide.inquiry.dto.InquiryCursorRequest;
import com.example.forguide.inquiry.dto.InquiryResponse;
import com.example.forguide.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/inquiries")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final InquiryService inquiryService;

    @GetMapping
    public ApiResponse<List<InquiryResponse>> getAllInquiries(
            @Valid @ModelAttribute InquiryCursorRequest cursor
    ) {
        return ApiResponse.ok(inquiryService.getAllInquiries(cursor));
    }

    @GetMapping("/{inquiryId}")
    public ApiResponse<InquiryResponse> getInquiry(
            @PathVariable Long inquiryId
    ) {
        return ApiResponse.ok(
                inquiryService.getInquiryForAdmin(inquiryId)
        );
    }

    // 관리자 권한은 /api/v1/admin/** 보안 규칙이 검증한다.
    @PatchMapping("/{inquiryId}/answer")
    public ApiResponse<Void> answerInquiry(
            @AuthenticationPrincipal Long adminMemberId,
            @PathVariable Long inquiryId,
            @Valid @RequestBody InquiryAnswerRequest request
    ) {
        inquiryService.answerInquiry(
                adminMemberId, inquiryId, request);

        return ApiResponse.ok();
    }
}
