package com.example.forguide.community.mapper;

import com.example.forguide.community.dto.*;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommunityMapper {
    // 게시글
    List<CommunityPostResponse> findAllPosts();

    CommunityPostResponse findPostById(Long postId);

    List<CommunityPostResponse> findPostsByCursor(
            @Param("cursor") CommunityPostCursorRequest cursor,
            @Param("memberId") Long memberId,
            @Param("topicKeywords") List<String> topicKeywords
    );

    // 로그인 회원이 리포스트한 원본 게시글 목록
    List<CommunityPostResponse> findRepostedPostsByMemberId(
            @Param("memberId") Long memberId
    );

    // 공감순 or 조회순 기준으로 인기 게시글 상위 10개 조회.
    List<CommunityPostResponse> findPopularPosts(
            @Param("sortBy") String sortBy,
            @Param("size") int size
    );

    // 게시글 삭제 전에 연결된 모든 공감 기록을 먼저 삭제한다.
    int deletePostLikesByPostId(@Param("postId") Long postId);

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

    // 활성화된 카테고리를 표시 순서대로 조회
    List<CommunityOptionResponse> findActiveCategories();

    // 활성화된 주요 주제를 표시 순서대로 조회
    List<CommunityOptionResponse> findActiveTopics();

    // 특정 카테고리에서 선택 가능한 관련 서비스를 조회
    List<CommunityOptionResponse> findActiveRelatedServicesByCategory(
            @Param("categoryCode") String categoryCode
    );

    // 활성 카테고리인지 확인
    boolean existsActiveCategory(
            @Param("categoryCode") String categoryCode
    );

    // 해당 카테고리에서 활성 관련 서비스인지 확인
    boolean existsActiveRelatedServiceByCategory(
            @Param("serviceCode") String serviceCode,
            @Param("categoryCode") String categoryCode
    );

    // 활성 주요 주제인지 확인
    boolean existsActiveTopic(
            @Param("topicCode") String topicCode
    );

    // 주제 필터가 본문 검색에 사용할 키워드 조회
    List<String> findActiveTopicKeywords(
            @Param("topicCode") String topicCode
    );

    // 댓글
    List<CommunityCommentResponse> findCommentsByPostId(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId
    );

    // 최상위 댓글만 커서 기준으로 필요한 만큼 조회한다.
    List<CommunityCommentResponse> findRootCommentsByCursor(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("cursor") CommunityCommentCursorRequest cursor
    );

    // 방금 조회한 최상위 댓글에 연결된 답글을 함께 조회한다.
    List<CommunityCommentResponse> findRepliesByParentCommentIds(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("parentCommentIds") List<Long> parentCommentIds
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
