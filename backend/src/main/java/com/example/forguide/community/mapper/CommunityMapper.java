package com.example.forguide.community.mapper;

import com.example.forguide.community.dto.CommunityCommentResponse;
import com.example.forguide.community.dto.CommunityMemberPreviewResponse;
import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.community.dto.CommunityPostImageResponse;
import com.example.forguide.community.dto.CommunityPostResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommunityMapper {
    // 게시글
    List<CommunityPostResponse> findAllPosts();

    CommunityPostResponse findPostById(Long postId);

    List<CommunityPostResponse> findPostsByCursor(
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorPostId") Long cursorPostId,
            @Param("size") int size
    );

    int insertPost(CommunityPostCreateRequest request);

    int updatePost(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("content") String content
    );

    int deletePost(@Param("postId") Long postId, @Param("memberId") Long memberId);

    // 게시글 사진
    List<CommunityPostImageResponse> findImagesByPostIds(
            @Param("postIds") List<Long> postIds
    );

    int insertPostImage(
            @Param("postId") Long postId,
            @Param("imageUrl") String imageUrl,
            @Param("displayOrder") int displayOrder
    );

    int deletePostImage(
            @Param("postId") Long postId,
            @Param("imageId") Long imageId
    );

    // 댓글
    List<CommunityCommentResponse> findCommentsByPostId(Long postId);

    CommunityCommentResponse findCommentById(Long commentId);

    int insertComment(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("content") String content
    );

    int updateComment(
            @Param("commentId") Long commentId,
            @Param("memberId") Long memberId,
            @Param("content") String content
    );

    int deleteComment(@Param("commentId") Long commentId);

    int deleteCommentsByPostId(@Param("postId") Long postId);

    //  공감
    long countLikesByPostId(@Param("postId") Long postId);

    boolean existsPostLike(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );

    int insertPostLike(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );

    int deletePostLike(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );

    // ── 작성자 프로필 미리보기: 조회 전용 ──
    CommunityMemberPreviewResponse findMemberPreviewById(
            @Param("memberId") Long memberId
    );

    // 게시글의 전체 리포스트 수 조회
    long countRepostsByPostId(@Param("postId") Long postId);

    // 현재 로그인 회원이 해당 게시글을 리포스트했는지 조회
    boolean existsPostRepost(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );

    // 로그인 회원의 리포스트 추가
    int insertPostRepost(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );

    // 현재 로그인 회원의 리포스트 취소
    int deletePostRepost(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );
}
