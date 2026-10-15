package com.example.forguide.community.service;


import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.mapper.CommunityMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.example.forguide.community.dto.CommunityPostCreateRequest;
import com.example.forguide.member.common.ApiException;
import com.example.forguide.member.common.ErrorCode;
import com.example.forguide.community.dto.CommunityPostImageResponse;
import com.example.forguide.community.image.CommunityImageStorage;
import java.util.ArrayList;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
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

    // 무한 스크롤용 게시글 조회
    public List<CommunityPostResponse> getPostsByCursor(
            LocalDateTime cursorCreatedAt,
            Long cursorPostId,
            int size
    ) {
        return attachImages(communityMapper.findPostsByCursor(
                cursorCreatedAt, cursorPostId, size
        ));
    }
    // 게시글을 저장한 뒤 사진 파일과 DB 사진 정보 함께 저장
    @Transactional
    public int createPost(Long memberId, CommunityPostCreateRequest request,
                          List<MultipartFile> images
    ) {
        // memberId는 요청값을 믿지 않고 로그인 정보로 항상 덮어쓴다.
        request.setMemberId(memberId);

        int insertedCount = communityMapper.insertPost(request);

        if(insertedCount != 1 || request.getPostId() == null) {
            throw new IllegalStateException("게시글을 저장하지 못했습니다.");
        }

        List<MultipartFile> imageFiles = images == null ? List.of() : images;
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

        int deletedCount = communityMapper.deletePost(postId, memberId);

        if (deletedCount == 0) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }

        images.forEach(image ->
                communityImageStorage.deleteIfOwned(image.getImageUrl())
        );
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
}
