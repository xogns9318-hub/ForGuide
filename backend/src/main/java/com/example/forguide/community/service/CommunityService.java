package com.example.forguide.community.service;


import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.repository.CommunityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import com.example.forguide.community.dto.CommunityPostCreateRequest;
import java.time.LocalDateTime;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityMapper communityMapper;

    // 게시글 전체 목록 조회
    public List<CommunityPostResponse> getAllPosts() {
        return communityMapper.findAllPosts();
    }

    // 게시글 상세 조회
    public CommunityPostResponse getPostById(Long postId) {
        CommunityPostResponse post = communityMapper.findPostById(postId);

        //해당 게시글이 존재하지 않으면 404 오류 반환
        if(post == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "게시글을 찾을 수 없습니다."
            );
        }
        return post;
    }

    // 무한 스크롤용 게시글 조회
    public List<CommunityPostResponse> getPostsByCursor(
            LocalDateTime cursorCreatedAt,
            Long cursorPostId,
            int size
    ) {
        return communityMapper.findPostsByCursor(
                cursorCreatedAt, cursorPostId, size
        );
    }
    // 게시글 작성
    public int createPost(Long memberId, CommunityPostCreateRequest request) {
        return communityMapper.insertPost(
                memberId,
                request.getTopic(),
                request.getContent(),
                request.getLanguage()
        );
    }
}
