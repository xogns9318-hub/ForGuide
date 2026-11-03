package com.example.forguide.inquiry.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.inquiry.dto.InquiryCreateRequest;
import com.example.forguide.inquiry.dto.InquiryCursorRequest;
import com.example.forguide.inquiry.dto.InquiryResponse;
import com.example.forguide.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    // 로그인한 회원이 새 문의를 등록한다.
    @PostMapping
    public ApiResponse<Void> createInquiry(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody InquiryCreateRequest request
    ) {
        inquiryService.createInquiry(memberId, request);

        return ApiResponse.ok();
    }

    // 로그인한 회원은 자신의 문의 목록만 조회한다.
    @GetMapping
    public ApiResponse<List<InquiryResponse>> getMyInquiries(
            @AuthenticationPrincipal Long memberId,
            @Valid @ModelAttribute InquiryCursorRequest cursor
    ) {
        return ApiResponse.ok(
                inquiryService.getMyInquiries(memberId, cursor)
        );
    }

    // 주소를 직접 바꿔도 다른 회원 문의는 조회되지 않는다.
    @GetMapping("/{inquiryId}")
    public ApiResponse<InquiryResponse> getMyInquiry(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long inquiryId
    ) {
        return ApiResponse.ok(
                inquiryService.getMyInquiry(memberId, inquiryId)
        );
    }
}
