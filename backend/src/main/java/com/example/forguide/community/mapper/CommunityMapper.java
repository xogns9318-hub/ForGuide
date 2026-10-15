package com.example.forguide.community.mapper;

import com.example.forguide.community.dto.CommunityPostResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.example.forguide.community.dto.CommunityPostImageResponse;
import com.example.forguide.community.dto.CommunityPostCreateRequest;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface CommunityMapper {

    // 게시글 전체 목록 조회
    List<CommunityPostResponse> findAllPosts();

    // 게시글 상세 조회
    CommunityPostResponse findPostById(Long postId);

    // 게시글 저장 후 생성된 postId를 request.postId에 넣는다
    int insertPost(CommunityPostCreateRequest request);

    // 서버 폴더에 저장한 사진 주소를 게시글에 연결
    int insertPostImage(
            @Param("postId") Long postId,
            @Param("imageUrl") String imageUrl,
            @Param("displayOrder") int displayOrder
    );

    // 무한 스크롤용 게시글 조회
    List<CommunityPostResponse> findPostsByCursor(
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorPostId") Long cursorPostId,
            @Param("size") int size
    );

    // 작성자 번호까지 일치하는 게시글만 삭제
    int deletePost(@Param("postId") Long postId, @Param("memberId") Long memberId);

    // 여러 게시글의 사진 한 번에 조회
    List<CommunityPostImageResponse> findImagesByPostIds(
            @Param("postIds") List<Long> postIds
    );
}
