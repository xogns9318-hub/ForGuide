package com.example.forguide.community.controller;

import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.LocalDateTime;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.example.forguide.member.common.ApiResponse;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
@Validated
public class CommunityController {

    private final CommunityService communityService;

    // 게시글 전체 목록 조회
    @GetMapping("/posts")
    public ApiResponse<List<CommunityPostResponse>> getAllPosts() {
        return ApiResponse.ok(communityService.getAllPosts());
    }

    // 게시글 상세 조회
    @GetMapping("/posts/{postId}")
    public ApiResponse<CommunityPostResponse> getPostById(
            @PathVariable Long postId
    ) {
        return ApiResponse.ok(communityService.getPostById(postId));
    }

    // 무한 스크롤용 게시글 조회
    @GetMapping("/posts/scroll")
    public ApiResponse<List<CommunityPostResponse>> getPostsByCursor(
            @RequestParam(required = false) LocalDateTime cursorCreatedAt,
            @RequestParam(required = false) Long cursorPostId,
            @RequestParam @Min(1) @Max(50) int size
    ) {
        return ApiResponse.ok(
                communityService.getPostsByCursor(
                cursorCreatedAt,
                cursorPostId,
                size
            )
        );
    }

    // 게시글 작성: 본문과 선택 사진(최대 4장)을 multipart/form-data로 받는다
    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Integer> createPost(
            @AuthenticationPrincipal Long memberId,
            @Valid @ModelAttribute CommunityPostCreateRequest request,
            @RequestParam(value = "images", required = false)
            @Size(max = 4, message = "게시글 사진은 최대 4장까지 올릴 수 있습니다.")
            List<MultipartFile> images
    ) {
        return ApiResponse.ok(
                communityService.createPost(memberId, request, images)
        );
    }

    // 로그인한 작성자 본인만 게시글 삭제
    @DeleteMapping("/posts/{postId}")
    public ApiResponse<Void> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        communityService.deletePost(postId, memberId);
        return ApiResponse.ok();
    }
}
