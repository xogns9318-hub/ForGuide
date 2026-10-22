package com.example.forguide.community.service;

import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.mapper.CommunityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.community.dto.CommunityPostUpdateRequest;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.community.dto.CommunityPostImageResponse;
import com.example.forguide.community.image.CommunityImageStorage;
import com.example.forguide.community.dto.CommunityCommentCreateRequest;
import com.example.forguide.community.dto.CommunityCommentLikeResponse;
import com.example.forguide.community.dto.CommunityCommentResponse;
import com.example.forguide.community.dto.CommunityPostLikeResponse;
import com.example.forguide.community.dto.CommunityMemberPreviewResponse;
import com.example.forguide.community.dto.CommunityPostRepostResponse;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.dao.DuplicateKeyException;
import java.util.Map;
import java.util.Locale;
import java.util.stream.Collectors;
import java.time.LocalDateTime;



import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityService {

    private final CommunityMapper communityMapper;
    private final CommunityImageStorage communityImageStorage;

    // 게시글 전체 목록 조회
    public List<CommunityPostResponse> getAllPosts() {
        return attachImages(communityMapper.findAllPosts());
    }

    // 게시글 상세 조회
    public CommunityPostResponse getPostById(Long postId) {
        CommunityPostResponse post = communityMapper.findPostById(postId);

        // 해당 게시글이 없으면 공통 404 응답 반환
        if (post == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }
        return attachImages(List.of(post)).get(0);
    }

    // 게시글 상세 화면을 열 때만 조회 기록을 남긴다.
    @Transactional
    public CommunityPostResponse getPostByIdAndRecordView(
            Long postId,
            Long viewerMemberId,
            String visitorToken
    ) {
        CommunityPostResponse post = communityMapper.findPostById(postId);

        if (post == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }

        // 로그인 회원은 본인 게시글을 봐도 조회수에 포함하지 않는다.
        if (viewerMemberId != null) {
            boolean isPostAuthor = post.getMemberId().equals(viewerMemberId);

            if (!isPostAuthor
                    && !communityMapper.existsPostViewByMember(postId, viewerMemberId)) {
                communityMapper.insertPostViewRecord(postId, viewerMemberId, null);
            }
        }

        // 비로그인 사용자는 브라우저 쿠키 토큰으로 24시간 중복을 판단
        else if (visitorToken != null && !visitorToken.isBlank()
                && !communityMapper.existsPostViewByVisitor(postId, visitorToken)) {
            communityMapper.insertPostViewRecord(postId, null, visitorToken);
        }

        return getPostById(postId);
    }


    // 무한 스크롤용 게시글 조회
    public List<CommunityPostResponse> getPostsByCursor(
            LocalDateTime cursorCreatedAt,
            Long cursorPostId,
            String category,
            String keyword,
            String topic,
            int size
    ) {
        validateCategory(category);
        return attachImages(communityMapper.findPostsByCursor(
                cursorCreatedAt,
                cursorPostId,
                category,
                normalizeKeyword(keyword),
                getTopicKeywords(topic),
                size
        ));
    }

    // 허용한 정렬값만 Mapper에 전달하고, 인기 게시글은 상위 10개로 고정한다.
    public List<CommunityPostResponse> getPopularPosts(String sortBy) {
        String normalizedSortBy = "views".equals(sortBy) ? "views" : "likes";

        return attachImages(
                communityMapper.findPopularPosts(normalizedSortBy, 10)
        );
    }

    // 프로필 카드에서 회원이 작성한 게시글 목록을 보여준다.
    public List<CommunityPostResponse> getPostsByMemberId(Long memberId) {
        // 존재하지 않는 회원과 게시글이 없는 회원을 구분한다.
        getMemberPreview(memberId);
        return attachImages(communityMapper.findPostsByMemberId(memberId));
    }

    // 내 리포스트 탭에는 내가 리포스트한 원본 게시글만 최신 리포스트 순으로 보여 준다.
    public List<CommunityPostResponse> getRepostedPostsByMemberId(Long memberId) {
        return attachImages(communityMapper.findRepostedPostsByMemberId(memberId));
    }
    // 게시글을 저장한 뒤 사진 파일과 DB 사진 정보 함께 저장
    @Transactional
    public int createPost(Long memberId, CommunityPostCreateRequest request,
                          List<MultipartFile> images
    ) {
        List<MultipartFile> imageFiles = images == null
                ? List.of()
                : images.stream().filter(image -> !image.isEmpty()).toList();

        // 사진만 올리는 게시글은 허용하되, 글과 사진이 모두 비어 있는 요청은 막는다.
        if ((request.getContent() == null || request.getContent().isBlank())
                && imageFiles.isEmpty()) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "게시글 내용 또는 사진을 추가해주세요."
            );
        }

        // 사진만 올린 경우 DB에는 빈 본문으로 저장한다.
        if (request.getContent() == null) {
            request.setContent("");
        }

        // memberId는 요청값을 믿지 않고 로그인 정보로 항상 덮어쓴다.
        request.setMemberId(memberId);
        validateRelatedService(request);

        int insertedCount = communityMapper.insertPost(request);

        if(insertedCount != 1 || request.getPostId() == null) {
            throw new IllegalStateException("게시글을 저장하지 못했습니다.");
        }

        List<String> savedImageUrls = new ArrayList<>();

        try {
            for (int displayOrder = 0; displayOrder < imageFiles.size(); displayOrder++) {
                String imageUrl = communityImageStorage.store(
                        imageFiles.get(displayOrder)
                );
                savedImageUrls.add(imageUrl);

                communityMapper.insertPostImage(
                        request.getPostId(),
                        imageUrl,
                        displayOrder
                );
            }

            return insertedCount;
        } catch (RuntimeException exception) {
            // DB 작업 실패 시 이번 요청에서 저장한 서버 파일도 함께 정리.
            savedImageUrls.forEach(communityImageStorage::deleteIfOwned);
            throw exception;
            }
        }

    // 게시글 작성자 본인만 본문·사진을 수정한다.
    @Transactional
    public CommunityPostResponse updatePost(
            Long postId,
            Long memberId,
            CommunityPostUpdateRequest request,
            List<Long> removeImageIds,
            List<MultipartFile> images
    ) {
        CommunityPostResponse post = communityMapper.findPostById(postId);

        if (post == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }

        if (!post.getMemberId().equals(memberId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "본인이 작성한 게시글만 수정할 수 있습니다.");
        }

        List<CommunityPostImageResponse> existingImages =
                communityMapper.findImagesByPostIds(List.of(postId));

        Map<Long, CommunityPostImageResponse> existingImagesById =
                existingImages.stream().collect(Collectors.toMap(
                        CommunityPostImageResponse::getImageId,
                        image -> image
                ));

        Set<Long> imageIdsToRemove = new LinkedHashSet<>(
                removeImageIds == null ? List.of() : removeImageIds
        );

        if (!existingImagesById.keySet().containsAll(imageIdsToRemove)) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "삭제할 사진 정보가 올바르지 않습니다.");
        }

        List<MultipartFile> newImages = images == null
                ? List.of()
                : images.stream().filter(image -> !image.isEmpty()).toList();

        int nextImageCount = existingImages.size() - imageIdsToRemove.size()
                + newImages.size();

        if (nextImageCount > 4) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "게시글 사진은 최대 4장까지 올릴 수 있습니다.");
        }

        List<String> newImageUrls = new ArrayList<>();
        List<String> removedImageUrls = imageIdsToRemove.stream()
                .map(existingImagesById::get)
                .map(CommunityPostImageResponse::getImageUrl)
                .toList();

        try {
            if (communityMapper.updatePost(postId, memberId, request.getContent()) != 1) {
                throw new IllegalStateException("게시글을 수정하지 못했습니다.");
            }

            for (Long imageId : imageIdsToRemove) {
                if (communityMapper.deletePostImage(postId, imageId) != 1) {
                    throw new IllegalStateException("게시글 사진을 삭제하지 못했습니다.");
                }
            }

            Set<Integer> usedDisplayOrders = existingImages.stream()
                    .filter(image -> !imageIdsToRemove.contains(image.getImageId()))
                    .map(CommunityPostImageResponse::getDisplayOrder)
                    .collect(Collectors.toCollection(LinkedHashSet::new));

            int displayOrder = 0;
            for (MultipartFile image : newImages) {
                while (usedDisplayOrders.contains(displayOrder)) {
                    displayOrder++;
                }

                String imageUrl = communityImageStorage.store(image);
                newImageUrls.add(imageUrl);
                communityMapper.insertPostImage(postId, imageUrl, displayOrder);
                usedDisplayOrders.add(displayOrder);
            }

            // DB 커밋이 성공한 뒤에만 기존 서버 파일을 지운다.
            TransactionSynchronizationManager.registerSynchronization(
                    new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            removedImageUrls.forEach(communityImageStorage::deleteIfOwned);
                        }
                    }
            );

            return getPostById(postId);
        } catch (RuntimeException exception) {
            // 중간 실패로 DB가 롤백되면 이번 요청에서 저장한 새 파일도 정리한다.
            newImageUrls.forEach(communityImageStorage::deleteIfOwned);
            throw exception;
        }
    }

    // 카테고리는 정해진 세 가지 값만 허용해 필터 조건과 저장 값이 어긋나지 않게 한다.
    private void validateCategory(String category) {
        if (category == null || category.isBlank()) {
            return;
        }

        Set<String> categories = Set.of("QUESTION_ANSWER", "REVIEW_RECOMMEND", "FREE_TALK");
        if (!categories.contains(category)) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "올바른 카테고리를 선택해주세요.");
        }
    }

    // 관련 서비스는 후기·추천 글에서만 선택할 수 있다.
    private void validateRelatedService(CommunityPostCreateRequest request) {
        String relatedService = request.getRelatedService();

        if (relatedService == null || relatedService.isBlank()) {
            request.setRelatedService(null);
            return;
        }

        Set<String> services = Set.of(
                "ACCOUNT_RECOMMEND", "LOAN_RECOMMEND", "INSURANCE_RECOMMEND","EMPLOYMENT_GUIDE"
        );
        if (!"REVIEW_RECOMMEND".equals(request.getCategory()) || !services.contains(relatedService)) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "후기·추천 글에서만 관련 서비스를 연결할 수 있습니다.");
        }
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return keyword.trim();
    }

    // 주요 주제는 별도 분류로 저장하지 않고, 본문에 자연스럽게 등장한 단어를 찾는다.
    private List<String> getTopicKeywords(String topic) {
        if (topic == null || topic.isBlank()) {
            return List.of();
        }

        Map<String, List<String>> keywordsByTopic = Map.of(
                "ACCOUNT", List.of("계좌", "은행", "통장", "개설"),
                "LOAN", List.of("대출", "금리", "상환", "보증"),
                "INSURANCE", List.of("보험", "보장", "보험료", "가입"),
                "VISA_STAY", List.of("비자", "체류", "외국인등록", "연장"),
                "LIFE_TIP", List.of("교통", "병원", "휴대폰", "주거", "쓰레기")
        );

        List<String> keywords = keywordsByTopic.get(topic.toUpperCase(Locale.ROOT));
        if (keywords == null) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "올바른 주요 주제를 선택해주세요.");
        }
        return keywords;
    }

    // 작성자를 확인한 뒤 본인 게시글만 삭제
    @Transactional
    public void deletePost(Long postId, Long memberId) {
        CommunityPostResponse post = communityMapper.findPostById(postId);

        if (post == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }

        if (!post.getMemberId().equals(memberId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "본인이 작성한 게시글만 삭제할 수 있습니다.");
        }

        // DB 게시글을 지우기 전에 서버 폴더에서 지울 사진 URL을 확보한다
        List<CommunityPostImageResponse> images =
                communityMapper.findImagesByPostIds(List.of(postId));

        communityMapper.deletePostLikesByPostId(postId);
        // community_comments의 게시글 외래키는 CASCADE가 아니므로 먼저 정리한다.
        communityMapper.deleteCommentsByPostId(postId);

        int deletedCount = communityMapper.deletePost(postId, memberId);

        if (deletedCount == 0) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }

        // DB 삭제가 최종 저장된 경우에만 실제 사진 파일을 삭제
        // DB 작업이 실패해 롤백되면 기존 사진 파일은 그대로 보존
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        images.forEach(image ->
                                communityImageStorage.deleteIfOwned(
                                        image.getImageUrl()
                                )
                        );
                    }
                }
        );
    }

    // 게시글 좋아요 수와 현재 로그인 회원의 좋아요 여부를 조사한다.
    // memberId가 null 이면 비로그인 조회이므로 LikeByME는 false
    public CommunityPostLikeResponse getPostLikeStatus(Long postId, Long memberId) {
        validatePostExists(postId);

        CommunityPostLikeResponse response = new CommunityPostLikeResponse();
        response.setPostId(postId);
        response.setLikeCount(communityMapper.countLikesByPostId(postId));
        response.setLikedByMe(
                memberId != null
                        && communityMapper.existsPostLike(postId, memberId)
        );

        return response;
    }

    // 이미 좋아요를 누른 경우에는 중복 저장하지 않고 현재 상태만 돌려줌.
    @Transactional
    public CommunityPostLikeResponse likePost(
            Long postId,
            Long memberId
    ) {
        validatePostExists(postId);

        try {
            communityMapper.insertPostLike(postId, memberId);
        } catch (DuplicateKeyException exception) {
            // 이미 공감한 상태면 추가 저장 없이 현재 상태 반환
        }

        return getPostLikeStatus(postId, memberId);
    }

    // 좋아요 없는 상태에서 취소 요청이 와도 오류 없이 현재 상태 돌려준다.
    @Transactional
    public CommunityPostLikeResponse unlikePost(Long postId, Long memberId) {
        validatePostExists(postId);

        communityMapper.deletePostLike(postId, memberId);

        return getPostLikeStatus(postId, memberId);
    }

    // 게시글 리포스트 수와 현재 로그인 회원의 리포스트 여부 조회
    public CommunityPostRepostResponse getPostRepostStatus(
            Long postId, Long memberId
    ) {
        validatePostExists(postId);

        CommunityPostRepostResponse response = new CommunityPostRepostResponse();

        response.setPostId(postId);
        response.setRepostCount(communityMapper.countRepostsByPostId(postId)
        );
        response.setRepostedByMe(
                memberId != null
                    && communityMapper.existsPostRepost(postId, memberId)
        );

        return response;
    }

    // 이미 리포스트한 게시글이면 중복 저장하지 않고 현재 상태 돌려줌
    @Transactional
    public CommunityPostRepostResponse repostPost(
            Long postId, Long memberId
    ) {
        validatePostExists(postId);

        try {
            communityMapper.insertPostRepost(postId, memberId);
        } catch (DuplicateKeyException exception) {
            // 이미 리포스트한 상태면 추가 저장 없이 현재 상태를 반환한다.
        }

        return getPostRepostStatus(postId, memberId);
    }

    // 리포스트하지 않은 상태에서 취소해도 오류 없이 현재 상태를 돌려줌
    @Transactional
    public CommunityPostRepostResponse unrepostPost(
            Long postId, Long memberId
    ) {
        validatePostExists(postId);

        communityMapper.deletePostRepost(postId, memberId);

        return  getPostRepostStatus(postId, memberId);
    }

    // 비로그인 사용자도 작성자의 공개 요약 정보를 확인할 수 있다.
    public CommunityMemberPreviewResponse getMemberPreview(Long memberId) {
        CommunityMemberPreviewResponse preview =
                communityMapper.findMemberPreviewById(memberId);

        if (preview == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }

        return preview;
    }

    // 조회한 게시글들에 사진 목록을 한 번의 DB 조회로 연결한다
    private List<CommunityPostResponse> attachImages(
            List<CommunityPostResponse> posts
    ) {
        if (posts.isEmpty()) {
            return posts;
        }

        List<Long> postIds = posts.stream()
                .map(CommunityPostResponse::getPostId)
                .collect(Collectors.toList());

        Map<Long, List<CommunityPostImageResponse>> imagesByPostId =
                communityMapper.findImagesByPostIds(postIds).stream()
                        .collect(Collectors.groupingBy(
                                CommunityPostImageResponse::getPostId
                        ));

        posts.forEach(post -> post.setImages(
                imagesByPostId.getOrDefault(post.getPostId(), List.of())
        ));

        return posts;
    }

    // 게시글이 실제로 있는지 확인해 없는 게시글의 댓글 조회/작성을 막는다
    private void validatePostExists(Long postId) {
        if (communityMapper.findPostById(postId) == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }
    }

    // 게시글 댓글 목록 조회
    public List<CommunityCommentResponse> getCommentsByPostId(Long postId, Long memberId) {
        validatePostExists(postId);
        return communityMapper.findCommentsByPostId(postId, memberId);
    }

    // 로그인 회원 댓글 작성
    @Transactional
    public void createComment(Long postId, Long memberId, CommunityCommentCreateRequest request)
    {
        validatePostExists(postId);

        Long mentionedMemberId = null;

        if (request.getParentCommentId() != null) {
            CommunityCommentResponse parentComment = getCommentByPostId(
                    postId,
                    request.getParentCommentId()
            );

            // 삭제된 댓글에는 새 답글을 달 수 없게 해 대화 흐름을 명확히 한다.
            if (parentComment.isDeleted()) {
                throw new ApiException(ErrorCode.INVALID_INPUT, "삭제된 댓글에는 답글을 작성할 수 없습니다.");
            }

            // 답글의 답글은 서버에서도 막아 화면 규칙과 저장 규칙을 일치시킨다.
            if (parentComment.getParentCommentId() != null) {
                throw new ApiException(ErrorCode.INVALID_INPUT, "답글에는 다시 답글을 작성할 수 없습니다.");
            }

            // 화면의 @아이디 문자열을 믿지 않고 서버에서 실제 회원인지 확인해 태그 대상을 저장한다.
            if (request.getMentionLoginId() != null && !request.getMentionLoginId().isBlank()) {
                CommunityMemberPreviewResponse mentionedMember = communityMapper
                        .findMemberPreviewByLoginId(request.getMentionLoginId());

                if (mentionedMember == null) {
                    throw new ApiException(ErrorCode.INVALID_INPUT, "존재하지 않는 아이디는 태그할 수 없습니다.");
                }

                mentionedMemberId = mentionedMember.getMemberId();
            }
        } else if (request.getMentionLoginId() != null && !request.getMentionLoginId().isBlank()) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "태그는 답글에서만 사용할 수 있습니다.");
        }

        int insertedCount = communityMapper.insertComment(
                postId,
                memberId,
                request.getParentCommentId(),
                mentionedMemberId,
                request.getContent()
        );

        if(insertedCount != 1) {
            throw new IllegalStateException("댓글을 저장하지 못했습니다.");
        }
    }

    // 댓글이 존재하고 현재 게시글에 실제로 속하는지 확인한다.
    private CommunityCommentResponse getCommentByPostId(Long postId, Long commentId) {
        CommunityCommentResponse comment = communityMapper.findCommentById(commentId);

        if (comment == null || !comment.getPostId().equals(postId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "댓글을 찾을 수 없습니다.");
        }

        return comment;
    }

    // 댓글 공감 수와 현재 로그인 회원의 공감 여부를 함께 반환한다.
    public CommunityCommentLikeResponse getCommentLikeStatus(
            Long postId, Long commentId, Long memberId
    ) {
        validatePostExists(postId);
        getCommentByPostId(postId, commentId);

        CommunityCommentLikeResponse response = new CommunityCommentLikeResponse();
        response.setCommentId(commentId);
        response.setLikeCount(communityMapper.countLikesByCommentId(commentId));
        response.setLikedByMe(
                memberId != null
                        && communityMapper.existsCommentLike(commentId, memberId)
        );
        return response;
    }

    // 같은 회원의 중복 공감은 저장하지 않고 현재 상태를 돌려준다.
    @Transactional
    public CommunityCommentLikeResponse likeComment(
            Long postId,
            Long commentId,
            Long memberId
    ) {
        CommunityCommentResponse comment = getCommentByPostId(
                postId,
                commentId
        );

        if (comment.isDeleted()) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "삭제된 댓글에는 공감할 수 없습니다."
            );
        }

        try {
            communityMapper.insertCommentLike(commentId, memberId);
        } catch (DuplicateKeyException exception) {
            // 이미 공감한 상태면 추가 저장 없이 현재 상태를 반환한다.
        }

        return getCommentLikeStatus(postId, commentId, memberId);
    }

    // 아직 공감하지 않은 상태에서 취소해도 현재 상태를 그대로 돌려준다.
    @Transactional
    public CommunityCommentLikeResponse unlikeComment(
            Long postId, Long commentId, Long memberId
    ) {
        getCommentByPostId(postId, commentId);
        communityMapper.deleteCommentLike(commentId, memberId);
        return getCommentLikeStatus(postId, commentId, memberId);
    }

    // 댓글 작성자 본인만 수정할 수 있다.
    @Transactional
    public void updateComment(
            Long postId,
            Long commentId,
            Long memberId,
            CommunityCommentCreateRequest request
    ) {
        validatePostExists(postId);
        CommunityCommentResponse comment = getCommentByPostId(postId, commentId);

        if (!comment.getMemberId().equals(memberId)) {
            throw new ApiException(ErrorCode.FORBIDDEN, "본인이 작성한 댓글만 수정할 수 있습니다.");
        }

        int updatedCount = communityMapper.updateComment(
                commentId,
                memberId,
                request.getContent()
        );

        if (updatedCount != 1) {
            throw new IllegalStateException("댓글을 수정하지 못했습니다.");
        }
    }

    // 댓글 작성자 또는 원문 게시글 작성자만 삭제할 수 있다.
    @Transactional
    public void deleteComment(Long postId, Long commentId, Long memberId) {
        CommunityPostResponse post = communityMapper.findPostById(postId);

        if (post == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }

        CommunityCommentResponse comment = getCommentByPostId(postId, commentId);
        if (comment.isDeleted()) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "이미 삭제된 댓글입니다.");
        }
        boolean isCommentAuthor = comment.getMemberId().equals(memberId);
        boolean isPostAuthor = post.getMemberId().equals(memberId);

        if (!isCommentAuthor && !isPostAuthor) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    "댓글 작성자 또는 게시글 작성자만 삭제할 수 있습니다."
            );
        }

        // 자식 답글이 있으면 본문만 삭제 표시로 바꿔 대화와 다른 회원의 답글을 보존한다.
        int changedCount = communityMapper.hasChildComments(commentId)
                ? communityMapper.markCommentDeleted(commentId)
                : communityMapper.deleteComment(commentId);

        if (changedCount != 1) {
            throw new IllegalStateException("댓글을 삭제하지 못했습니다.");
        }
    }
}
