package com.example.forguide.employment.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.employment.dto.ResumeResponse;
import com.example.forguide.employment.dto.ResumeSaveRequest;
import com.example.forguide.employment.service.ResumeService;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import java.nio.file.Path;

@RestController
@RequestMapping("/api/v1/employment/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    // 이력서 텍스트와 선택한 증명사진을 함께 저장
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ResumeResponse> saveResume(
            @AuthenticationPrincipal Long memberId,
            @Valid @ModelAttribute ResumeSaveRequest request,
            @RequestParam(value = "photo", required = false)
            MultipartFile photo
    ) {
        return ApiResponse.ok(
                resumeService.saveResume(memberId, request, photo)
        );
    }

    /*
     * 로그인한 사용자의 이력서 입력값을 한국어 초안으로 번역한다.
     * 원문과 번역문은 저장하지 않고, 화면에서 사용자가 검토한 뒤 저장한다.
     */
    @PostMapping("/translation")
    public ApiResponse<TranslationResponse> translateResumeText(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody TranslationRequest request
    ) {
        return ApiResponse.ok(
                resumeService.translateMyResumeText(memberId, request)
        );
    }

    // 로그인한 회원의 일반·블라인드 이력서 목록을 조회
    @GetMapping
    public ApiResponse<List<ResumeResponse>> getMyResumes(
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                resumeService.getMyResumes(memberId)
        );
    }

    // 로그인한 회원의 이력서 한 건만 조회
    @GetMapping("/{resumeId}")
    public ApiResponse<ResumeResponse> getMyResume(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long resumeId
    ) {
        return ApiResponse.ok(
                resumeService.getMyResume(memberId, resumeId)
        );
    }

    // 로그인한 회원 본인의 이력서 사진만 파일 형태로 반환
    @GetMapping("/{resumeId}/photo")
    public ResponseEntity<Resource> getMyResumePhoto(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long resumeId
    ) {
        Path photoPath = resumeService.getMyResumePhoto(
                memberId,
                resumeId
        );

        Resource photo = new FileSystemResource(photoPath);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(photo);
    }

    // 로그인한 회원 본인의 이력서 사진만 즉시 삭제
    @DeleteMapping("/{resumeId}/photo")
    public ApiResponse<Void> deleteMyResumePhoto(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long resumeId
    ) {
        resumeService.deleteMyResumePhoto(memberId, resumeId);
        return ApiResponse.ok();
    }

    // 로그인한 회원 본인의 이력서만 삭제
    @DeleteMapping("/{resumeId}")
    public ApiResponse<Void> deleteResume(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long resumeId
    ) {
        resumeService.deleteResume(memberId, resumeId);
        return ApiResponse.ok();
    }
}
