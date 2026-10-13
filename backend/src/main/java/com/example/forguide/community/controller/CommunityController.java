package com.example.forguide.community.controller;

import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.service.CommunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.LocalDateTime;

import java.util.List;

@RestController
@RequestMapping("/api/community")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    // 게시글 전체 목록 조회
    @GetMapping("/posts")
    public List<CommunityPostResponse> getAllPosts() {
        return communityService.getAllPosts();
    }

    // 게시글 상세 조회
    @GetMapping("/posts/{postId}")
    public CommunityPostResponse getPostById(@PathVariable Long postId) {
        return communityService.getPostById(postId);
    }

    // 무한 스크롤용 게시글 조회
    @GetMapping("/posts/scroll")
    public List<CommunityPostResponse> getPostsByCursor(
            @RequestParam(required = false) LocalDateTime cursorCreatedAt,
            @RequestParam(required = false) Long cursorPostId,
            @RequestParam int size
    ) {
        return communityService.getPostsByCursor(
                cursorCreatedAt,
                cursorPostId,
                size
        );
    }

    // 게시글 작성
    @PostMapping("/posts")
    public int createPost(@RequestBody CommunityPostCreateRequest request) {
        return communityService.createPost(1L, request);
    }
}
