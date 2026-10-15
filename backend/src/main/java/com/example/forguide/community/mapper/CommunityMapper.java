package com.example.forguide.community.mapper;

import com.example.forguide.community.dto.CommunityPostResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.example.forguide.community.dto.CommunityPostImageResponse;
import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.community.dto.CommunityCommentResponse;

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

    // 게시글 작성자 본인만 본문을 수정
    int updatePost(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("content") String content
    );

    // 서버 폴더에 저장한 사진 주소를 게시글에 연결
    int insertPostImage(
            @Param("postId") Long postId,
            @Param("imageUrl") String imageUrl,
            @Param("displayOrder") int displayOrder
    );

    // 게시글에 속한 사진 한 장의 DB 정보만 삭제
    int deletePostImage(
            @Param("postId") Long postId,
            @Param("imageId") Long imageId
    );

    // 게시글의 댓글을 작성 시간 순서대로 조회
    List<CommunityCommentResponse> findCommentsByPostId(Long postId);

    // 로그인 회원이 댓글 하나 작성
    int insertComment(
            @Param("postId") Long postId,
            @Param("memberId") Long memberId,
            @Param("content") String content
    );

    // 댓글 번호로 댓글 하나 조회
    CommunityCommentResponse findCommentById(Long commentId);

    // 댓글 작성자 본인만 내용을 수정
    int updateComment(
            @Param("commentId") Long commentId,
            @Param("memberId") Long memberId,
            @Param("content") String content
    );

    // 권한 확인은 Service에서 마친 뒤 댓글 삭제
    int deleteComment(@Param("commentId") Long commentId);

    // 게시글 삭제 전에 연결된 댓글을 함께 삭제
    int deleteCommentsByPostId(@Param("postId") Long postId);

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
