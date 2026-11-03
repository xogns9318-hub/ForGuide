package com.example.forguide.admin.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.inquiry.dto.InquiryAnswerRequest;
import com.example.forguide.inquiry.dto.InquiryCursorRequest;
import com.example.forguide.inquiry.dto.InquiryResponse;
import com.example.forguide.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import java.nio.file.Path;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    // 관리자 주소는 SecurityConfig가 ADMIN 권한을 검증한다.
    @GetMapping("/{inquiryId}/images/{inquiryImageId}")
    public ResponseEntity<Resource> getInquiryImage(
            @PathVariable Long inquiryId,
            @PathVariable Long inquiryImageId
    ) {
        Path imagePath = inquiryService.getInquiryImageForAdmin(
                inquiryId,
                inquiryImageId
        );

        return ResponseEntity.ok()
                .contentType(
                        MediaTypeFactory
                                .getMediaType(imagePath.getFileName().toString())
                                .orElse(MediaType.APPLICATION_OCTET_STREAM)
                )
                .body(new FileSystemResource(imagePath));
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
