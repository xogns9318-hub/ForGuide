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

import java.util.List;

@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
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
            @RequestParam int size
    ) {
        return ApiResponse.ok(
                communityService.getPostsByCursor(
                cursorCreatedAt,
                cursorPostId,
                size
            )
        );
    }

    // 게시글 작성
    @PostMapping("/posts")
    public ApiResponse<Integer> createPost(
            @AuthenticationPrincipal Long memberId,
            @RequestBody CommunityPostCreateRequest request
    ) {
        return ApiResponse.ok(
                communityService.createPost(memberId, request)
        );
    }
}
