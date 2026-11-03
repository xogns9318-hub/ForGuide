package com.example.forguide.inquiry.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.inquiry.dto.InquiryCreateRequest;
import com.example.forguide.inquiry.dto.InquiryCursorRequest;
import com.example.forguide.inquiry.dto.InquiryResponse;
import com.example.forguide.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import java.nio.file.Path;
import java.util.List;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    // 로그인한 회원이 새 문의를 등록한다.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Void> createInquiry(
            @AuthenticationPrincipal Long memberId,
            @Valid @ModelAttribute InquiryCreateRequest request,
            @RequestParam(value = "images", required = false)
            @Size(max = 4, message = "문의 사진은 최대 4장까지 올릴 수 있습니다.")
            List<MultipartFile> images
    ) {
        inquiryService.createInquiry(memberId, request, images);

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

    // 문의 작성자 본인만 첨부 사진 원본을 받을 수 있다.
    @GetMapping("/{inquiryId}/images/{inquiryImageId}")
    public ResponseEntity<Resource> getMyInquiryImage(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long inquiryId,
            @PathVariable Long inquiryImageId
    ) {
        Path imagePath = inquiryService.getMyInquiryImage(
                memberId,
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
}
