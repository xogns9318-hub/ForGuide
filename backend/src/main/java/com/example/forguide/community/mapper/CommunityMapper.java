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
            @Param("category") String category,
            @Param("keyword") String keyword,
            @Param("topicKeywords") List<String> topicKeywords,
            @Param("size") int size
    );

    // 사용자가 선택한 공감순 또는 조회순으로 인기 게시글 목록을 조회한다.
    List<CommunityPostResponse> findPopularPosts(
            @Param("sortBy") String sortBy,
            @Param("size") int size
    );

    // 프로필 미리보기의 작성글 목록 모달에 표시할 게시글 조회
    List<CommunityPostResponse> findPostsByMemberId(
            @Param("memberId") Long memberId
    );

    // 로그인 회원이 리포스트한 원본 게시글 목록
    List<CommunityPostResponse> findRepostedPostsByMemberId(
            @Param("memberId") Long memberId
    );

    int insertPost(CommunityPostCreateRequest request);

    int updatePost(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("content") String content
    );

    int deletePost(@Param("postId") Long postId, @Param("memberId") Long memberId);

    // 게시글 조회수 : 로그인 회원의 최근 24시간 조회 기록 확인
    boolean existsPostViewByMember(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );

    // 게시글 조회수: 비회원 브라우저의 최근 24시간 조회 기록 확인
    boolean existsPostViewByVisitor(
            @Param("postId") Long postId,
            @Param("visitorToken") String visitorToken
    );

    // 게시글 조회수: 로그인 회원 또는 비회원의 조회 기록 저장
    int insertPostViewRecord(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("visitorToken") String visitorToken
    );

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
    List<CommunityCommentResponse> findCommentsByPostId(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );

    CommunityCommentResponse findCommentById(Long commentId);

    int insertComment(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("parentCommentId") Long parentCommentId,
            @Param("mentionedMemberId") Long mentionedMemberId,
            @Param("content") String content
    );

    boolean hasChildComments(@Param("commentId") Long commentId);

    int updateComment(
            @Param("commentId") Long commentId,
            @Param("memberId") Long memberId,
            @Param("content") String content
    );

    int deleteComment(@Param("commentId") Long commentId);

    int markCommentDeleted(@Param("commentId") Long commentId);

    int deleteCommentsByPostId(@Param("postId") Long postId);

    // 댓글 공감
    long countLikesByCommentId(@Param("commentId") Long commentId);

    boolean existsCommentLike(
            @Param("commentId") Long commentId,
            @Param("memberId") Long memberId
    );

    int insertCommentLike(
            @Param("commentId") Long commentId,
            @Param("memberId") Long memberId
    );

    int deleteCommentLike(
            @Param("commentId") Long commentId,
            @Param("memberId") Long memberId
    );

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

    CommunityMemberPreviewResponse findMemberPreviewByLoginId(
            @Param("loginId") String loginId
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
