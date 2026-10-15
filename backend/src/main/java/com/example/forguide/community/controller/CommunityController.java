package com.example.forguide.community.controller;

import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.dto.CommunityPostUpdateRequest;
import com.example.forguide.community.service.CommunityService;
import com.example.forguide.community.dto.CommunityCommentCreateRequest;
import com.example.forguide.community.dto.CommunityCommentResponse;
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

    // 로그인한 작성자 본인만 본문·사진을 수정한다.
    @PatchMapping(value = "/posts/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CommunityPostResponse> updatePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId,
            @Valid @ModelAttribute CommunityPostUpdateRequest request,
            @RequestParam(value = "removeImageIds", required = false)
            List<Long> removeImageIds,
            @RequestParam(value = "images", required = false)
            @Size(max = 4, message = "한 번에 추가할 사진은 최대 4장까지입니다.")
            List<MultipartFile> images
    ) {
        return ApiResponse.ok(
                communityService.updatePost(
                        postId,
                        memberId,
                        request,
                        removeImageIds,
                        images
                )
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

    // 비로그인 사용자도 게시글의 댓글 목록을 볼 수 있다
    @GetMapping("/posts/{postId}/comments")
    public ApiResponse<List<CommunityCommentResponse>> getCommentsByPostId(
            @PathVariable Long postId
    )   {
        return ApiResponse.ok(
                communityService.getCommentsByPostId(postId)
        );
    }

    // 로그인한 회원만 댓글 작성 가능
    @PostMapping("/posts/{postId}/comments")
    public ApiResponse<Void> createComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody CommunityCommentCreateRequest request
    ) {
        communityService.createComment(postId, memberId, request);
        return ApiResponse.ok();
    }

    // 댓글 작성자 본인만 수정할 수 있다.
    @PatchMapping("/posts/{postId}/comments/{commentId}")
    public ApiResponse<Void> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody CommunityCommentCreateRequest request
    ) {
        communityService.updateComment(postId, commentId, memberId, request);
        return ApiResponse.ok();
    }

    // 댓글 작성자 또는 게시글 작성자만 삭제할 수 있다.
    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ApiResponse<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long memberId
    ) {
        communityService.deleteComment(postId, commentId, memberId);
        return ApiResponse.ok();
    }
}
