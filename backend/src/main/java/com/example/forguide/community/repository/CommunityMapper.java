package com.example.forguide.community.repository;

import com.example.forguide.community.dto.CommunityPostResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface CommunityMapper {

    // 게시글 전체 목록 조회
    List<CommunityPostResponse> findAllPosts();

    //게시글 상세 조회
    CommunityPostResponse findPostById(Long postId);

    // 게시글 작성
    int insertPost(@Param("memberId") Long memberId, @Param("topic") String topic,
                   @Param("content") String content, @Param("language") String language);

    // 무한 스크롤용 게시글 조회
    List<CommunityPostResponse> findPostsByCursor(
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorPostId") Long cursorPostId,
            @Param("size") int size
    );
}
