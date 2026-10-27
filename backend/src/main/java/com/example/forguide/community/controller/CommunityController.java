package com.example.forguide.community.controller;

import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.dto.CommunityPostUpdateRequest;
import com.example.forguide.community.service.CommunityService;
import com.example.forguide.community.dto.CommunityCommentCreateRequest;
import com.example.forguide.community.dto.CommunityCommentResponse;
import com.example.forguide.community.dto.CommunityCommentLikeResponse;
import com.example.forguide.community.dto.CommunityPostLikeResponse;
import com.example.forguide.community.dto.CommunityMemberPreviewResponse;
import com.example.forguide.community.dto.CommunityPostRepostResponse;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import com.example.forguide.translation.dto.TranslationTargetRequest;
import com.example.forguide.translation.service.TranslationService;
import com.example.forguide.translation.cache.TranslationCacheResource;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.LocalDateTime;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.example.forguide.common.response.ApiResponse;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@RestController
@RequestMapping("/api/v1/community")
@RequiredArgsConstructor
@Validated
public class CommunityController {

    private final CommunityService communityService;
    private final TranslationService translationService;

    // 게시글 전체 목록 조회
    @GetMapping("/posts")
    public ApiResponse<List<CommunityPostResponse>> getAllPosts() {
        return ApiResponse.ok(communityService.getAllPosts());
    }

    // 게시글 상세 조회: 조회수는 이 API를 열 때만 집계
    @GetMapping("/posts/{postId}")
    public ApiResponse<CommunityPostResponse> getPostById(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId,
            @CookieValue(value = "community_viewer_token", required = false)
            String visitorToken,
            HttpServletResponse response
    ) {
        // 비로그인 첫 방문자에게만 브라우저 식별용 쿠키를 발급
        if (memberId == null
                && (visitorToken == null ||visitorToken.isBlank())) {
            visitorToken = UUID.randomUUID().toString();

            Cookie cookie = new Cookie("community_viewer_token", visitorToken);
            cookie.setHttpOnly(true);
            cookie.setPath("/");
            cookie.setMaxAge(60 * 60 * 24 * 365);
            response.addCookie(cookie);
        }

        return ApiResponse.ok(
                communityService.getPostByIdAndRecordView(postId, memberId, visitorToken)
        );
    }

    // 공개 게시글은 비로그인 방문자도 번역할 수 있다.
    // 원문과 원문 언어는 요청 본문이 아니라 서버가 postId로 직접 조회한다.
    @PostMapping("/posts/{postId}/translation")
    public ApiResponse<TranslationResponse> translatePost(
            @PathVariable Long postId,
            @Valid @RequestBody TranslationTargetRequest request
    ) {
        CommunityPostResponse post = communityService.getPostById(postId);

        if (!List.of("ko", "en", "ja", "zh", "vi", "th")
                .contains(post.getLanguage())) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "게시글의 원본 언어를 확인할 수 없습니다."
            );
        }

        TranslationRequest translationRequest = new TranslationRequest();
        translationRequest. setSourceLanguage(post.getLanguage());
        translationRequest. setTargetLanguage(request.getTargetLanguage());
        translationRequest. setSourceText(post.getContent());

        return ApiResponse.ok(
                translationService.translatePublicText(
                        translationRequest,
                        new TranslationCacheResource(
                                "community-post",
                                post.getPostId(),
                                post.getContentVersion()
                        )
                )
        );
    }


    // 무한 스크롤용 게시글 조회
    @GetMapping("/posts/scroll")
    public ApiResponse<List<CommunityPostResponse>> getPostsByCursor(
            @RequestParam(required = false) LocalDateTime cursorCreatedAt,
            @RequestParam(required = false) Long cursorPostId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @Size(max = 100) String keyword,
            @RequestParam(required = false) String topic,
            @RequestParam @Min(1) @Max(50) int size
    ) {
        return ApiResponse.ok(
                communityService.getPostsByCursor(
                        cursorCreatedAt,
                        cursorPostId,
                        category,
                        keyword,
                        topic,
                        size
                )
        );
    }

    // 오른쪽 인기 게시글: 공감순 또는 조회순 상위 10개를 반환한다.
    @GetMapping("/posts/popular")
    public ApiResponse<List<CommunityPostResponse>> getPopularPosts(
            @RequestParam(defaultValue = "likes")
            @Pattern(
                    regexp = "likes|views",
                    message = "정렬 기준은 likes 또는 views만 가능합니다."
            )
            String sortBy
    ) {
        return ApiResponse.ok(
                communityService.getPopularPosts(sortBy)
        );
    }

    // 로그인 회원이 리포스트한 게시글만 조회한다.
    @GetMapping("/my-reposts")
    public ApiResponse<List<CommunityPostResponse>> getMyRepostedPosts(
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(communityService.getRepostedPostsByMemberId(memberId));
    }

    // 게시글 작성: 본문과 선택 사진(최대 4장)을 multipart/form-data로 받는다
    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Integer> createPost(
            @AuthenticationPrincipal Long memberId,
            @Valid @ModelAttribute CommunityPostCreateRequest request,
            @RequestParam(value = "images", required = false)
            @Size(max = 4, message = "게시글 사진은 최대 4장까지 올릴 수 있습니다.")
            List<MultipartFile> images
    ) {
        return ApiResponse.ok(
                communityService.createPost(memberId, request, images)
        );
    }

    // 로그인한 작성자 본인만 본문·사진을 수정한다.
    @PatchMapping(value = "/posts/{postId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CommunityPostResponse> updatePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId,
            @Valid @ModelAttribute CommunityPostUpdateRequest request,
            @RequestParam(value = "removeImageIds", required = false)
            List<Long> removeImageIds,
            @RequestParam(value = "images", required = false)
            @Size(max = 4, message = "한 번에 추가할 사진은 최대 4장까지입니다.")
            List<MultipartFile> images
    ) {
        return ApiResponse.ok(
                communityService.updatePost(
                        postId,
                        memberId,
                        request,
                        removeImageIds,
                        images
                )
        );
    }

    // 로그인한 작성자 본인만 게시글 삭제
    @DeleteMapping("/posts/{postId}")
    public ApiResponse<Void> deletePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        communityService.deletePost(postId, memberId);
        return ApiResponse.ok();
    }

    // 비로그인 사용자도 게시글의 댓글 목록을 볼 수 있다
    @GetMapping("/posts/{postId}/comments")
    public ApiResponse<List<CommunityCommentResponse>> getCommentsByPostId(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.getCommentsByPostId(postId, memberId)
        );
    }

    // 공개 댓글은 비로그인 방문자도 번역할 수 있다.
    // 댓글 언어는 현재 저장·조회 흐름에서 확정하지 않으므로 Gemini가 자동 감지
    @PostMapping("/posts/{postId}/comments/{commentId}/translation")
    public ApiResponse<TranslationResponse> translateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody TranslationTargetRequest request
    ) {
        CommunityCommentResponse comment =
                communityService.getCommentForTranslation(
                        postId,
                        commentId
                );

        TranslationRequest translationRequest = new TranslationRequest();
        translationRequest.setSourceLanguage("auto");
        translationRequest.setTargetLanguage(request.getTargetLanguage());
        translationRequest.setSourceText(comment.getContent());

        return ApiResponse.ok(
                translationService.translatePublicText(
                        translationRequest,
                        new TranslationCacheResource(
                                "community-comment",
                                comment.getCommentId(),
                                comment.getContentVersion()
                        )
                )
        );
    }

    // 로그인한 회원만 댓글 작성 가능
    @PostMapping("/posts/{postId}/comments")
    public ApiResponse<Void> createComment(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody CommunityCommentCreateRequest request
    ) {
        communityService.createComment(postId, memberId, request);
        return ApiResponse.ok();
    }

    // 댓글 작성자 본인만 수정할 수 있다.
    @PatchMapping("/posts/{postId}/comments/{commentId}")
    public ApiResponse<Void> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody CommunityCommentCreateRequest request
    ) {
        communityService.updateComment(postId, commentId, memberId, request);
        return ApiResponse.ok();
    }

    // 댓글 작성자 또는 게시글 작성자만 삭제할 수 있다.
    @DeleteMapping("/posts/{postId}/comments/{commentId}")
    public ApiResponse<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long memberId
    ) {
        communityService.deleteComment(postId, commentId, memberId);
        return ApiResponse.ok();
    }

    // 로그인 회원의 댓글 공감 추가
    @PostMapping("/posts/{postId}/comments/{commentId}/likes")
    public ApiResponse<CommunityCommentLikeResponse> likeComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.likeComment(postId, commentId, memberId)
        );
    }

    // 로그인 회원의 댓글 공감 취소
    @DeleteMapping("/posts/{postId}/comments/{commentId}/likes")
    public ApiResponse<CommunityCommentLikeResponse> unlikeComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.unlikeComment(postId, commentId, memberId)
        );
    }

    // 비로그인 사용자도 좋아요 수는 볼 수 있고,
    // 로그인 상태면 내가 좋아요를 눌렀는지도 함께 반환한다.
    @GetMapping("/posts/{postId}/likes")
    public ApiResponse<CommunityPostLikeResponse> getPostLikeStatus(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.getPostLikeStatus(postId, memberId)
        );
    }

    // 로그인 회원이 게시글에 좋아요를 추가
    @PostMapping("/posts/{postId}/likes")
    public ApiResponse<CommunityPostLikeResponse> likePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.likePost(postId, memberId)
        );
    }

    // 로그인 회원이 자신의 좋아요를 취소
    @DeleteMapping("/posts/{postId}/likes")
    public ApiResponse<CommunityPostLikeResponse> unlikePost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.unlikePost(postId, memberId)
        );
    }

    // 게시글·댓글 작성자에 마우스를 올렸을 때 표시할 공개 프로필 요약
    @GetMapping("/members/{memberId}/preview")
    public ApiResponse<CommunityMemberPreviewResponse> getMemberPreview(
            @PathVariable Long memberId
    ) {
        return ApiResponse.ok(communityService.getMemberPreview(memberId));
    }

    // 프로필 미리보기의 게시글 수를 누르면 해당 회원이 작성한 글 목록을 반환한다.
    @GetMapping("/members/{memberId}/posts")
    public ApiResponse<List<CommunityPostResponse>> getMemberPosts(
            @PathVariable Long memberId
    ) {
        return ApiResponse.ok(communityService.getPostsByMemberId(memberId));
    }

    // 비로그인 사용자도 리포스트 수 볼 수 있고,
    // 로그인 상태면 내가 리포스트했는지도 함께 반환
    @GetMapping("/posts/{postId}/reposts")
    public ApiResponse<CommunityPostRepostResponse> getPostRepostStatus(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.getPostRepostStatus(postId, memberId)
        );
    }

    // 로그인 회원이 게시글을 리포스트한다.
    @PostMapping("/posts/{postId}/reposts")
    public ApiResponse<CommunityPostRepostResponse> repostPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.repostPost(postId, memberId)
        );
    }

    // 로그인 회원이 자신의 리포스트를 취소한다.
    @DeleteMapping("/posts/{postId}/reposts")
    public ApiResponse<CommunityPostRepostResponse> unrepostPost(
            @PathVariable Long postId,
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(
                communityService.unrepostPost(postId, memberId)
        );
    }
}
