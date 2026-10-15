package com.example.forguide.community.service;


import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.mapper.CommunityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.member.common.ApiException;
import com.example.forguide.member.common.ErrorCode;
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

        // 해당 게시글이 없으면 공통 404 응답 반환
        if (post == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
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
                request.getContent(),
                request.getLanguage()
        );
    }

    // 작성자를 확인한 뒤 본인 게시글만 삭제
    public void deletePost(Long postId, Long memberId) {
        CommunityPostResponse post = communityMapper.findPostById(postId);

        if (post == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }

        if (!post.getMemberId().equals(memberId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "본인이 작성한 게시글만 삭제할 수 있습니다.");
        }

        int deletedCount = communityMapper.deletePost(postId, memberId);

        if (deletedCount == 0) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }
    }
}
