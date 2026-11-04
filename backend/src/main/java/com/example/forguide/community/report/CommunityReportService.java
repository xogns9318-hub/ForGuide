package com.example.forguide.community.report;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.community.dto.CommunityCommentResponse;
import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.mapper.CommunityMapper;
import com.example.forguide.community.report.image.CommunityReportImageStorage;
import java.util.ArrayList;
import java.util.List;
import java.nio.file.Path;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityReportService {

    private final CommunityMapper communityMapper;
    private final CommunityReportMapper communityReportMapper;
    private final CommunityReportImageStorage communityReportImageStorage;

    public CommunityReportService(
            CommunityMapper communityMapper,
            CommunityReportMapper communityReportMapper,
            CommunityReportImageStorage communityReportImageStorage
    ) {
        this.communityMapper = communityMapper;
        this.communityReportMapper = communityReportMapper;
        this.communityReportImageStorage = communityReportImageStorage;
    }

    @Transactional
    public void reportPost(
            Long postId,
            Long reporterMemberId,
            CommunityReportCreateRequest request,
            List<org.springframework.web.multipart.MultipartFile> images
    ) {
        CommunityPostResponse post = communityMapper.findPostById(postId);
        validateTarget(post, reporterMemberId);
        create(reporterMemberId, CommunityReportResourceType.POST, postId, request.getReportReason(), images);
    }

    @Transactional
    public void reportComment(
            Long postId,
            Long commentId,
            Long reporterMemberId,
            CommunityReportCreateRequest request,
            List<org.springframework.web.multipart.MultipartFile> images
    ) {
        CommunityCommentResponse comment = communityMapper.findCommentById(commentId);

        if (comment == null || !postId.equals(comment.getPostId()) || comment.isDeleted()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "신고할 댓글을 찾을 수 없습니다.");
        }

        validateTarget(comment.getMemberId(), reporterMemberId);
        create(reporterMemberId, CommunityReportResourceType.COMMENT, commentId, request.getReportReason(), images);
    }

    private void validateTarget(CommunityPostResponse post, Long reporterMemberId) {
        if (post == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "신고할 게시글을 찾을 수 없습니다.");
        }
        validateTarget(post.getMemberId(), reporterMemberId);
    }

    private void validateTarget(Long authorMemberId, Long reporterMemberId) {
        if (reporterMemberId == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
        if (reporterMemberId.equals(authorMemberId)) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "본인의 게시글이나 댓글은 신고할 수 없습니다.");
        }
    }

    private void create(
            Long reporterMemberId,
            CommunityReportResourceType resourceType,
            Long resourceId,
            CommunityReportReason reportReason,
            List<org.springframework.web.multipart.MultipartFile> images
    ) {
        CommunityReportCreateCommand command =
                new CommunityReportCreateCommand(
                        reporterMemberId,
                        resourceType,
                        resourceId,
                        reportReason
                );

        try {
            communityReportMapper.insert(command);
        } catch (DuplicateKeyException exception) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "이미 신고한 콘텐츠입니다.");
        }

        List<String> storedImageUrls = new ArrayList<>();

        try {
            int displayOrder = 0;
            List<org.springframework.web.multipart.MultipartFile> safeImages =
                    images == null ? List.of() : images;

            for (org.springframework.web.multipart.MultipartFile image : safeImages) {
                if (image == null || image.isEmpty()) {
                    continue;
                }

                String imageUrl = communityReportImageStorage.store(image);
                storedImageUrls.add(imageUrl);
                communityReportMapper.insertImage(
                        command.getReportId(),
                        imageUrl,
                        displayOrder++
                );
            }
        } catch (RuntimeException exception) {
            storedImageUrls.forEach(communityReportImageStorage::deleteIfOwned);
            throw exception;
        }
    }

    // 신고자는 본인이 제출한 증빙 사진만 다시 확인할 수 있다.
    public List<CommunityReportImageResponse> getMyReportImages(
            Long reporterMemberId,
            Long reportId
    ) {
        if (reporterMemberId == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }

        return communityReportMapper.findImagesByReportIdAndReporterMemberId(
                reportId,
                reporterMemberId
        );
    }

    public Path getMyReportImage(
            Long reporterMemberId,
            Long reportId,
            Long reportImageId
    ) {
        if (reporterMemberId == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }

        CommunityReportImageResponse image =
                communityReportMapper.findImageByIdAndReportIdAndReporterMemberId(
                        reportId,
                        reportImageId,
                        reporterMemberId
                );

        return findStoredImage(image);
    }

    // 관리자 API는 SecurityConfig의 ADMIN 규칙을 통과한 뒤에만 이 메서드를 호출한다.
    public List<CommunityReportImageResponse> getReportImagesForAdmin(Long reportId) {
        return communityReportMapper.findImagesByReportId(reportId);
    }

    public Path getReportImageForAdmin(Long reportId, Long reportImageId) {
        return findStoredImage(
                communityReportMapper.findImageByIdAndReportId(
                        reportId,
                        reportImageId
                )
        );
    }

    private Path findStoredImage(CommunityReportImageResponse image) {
        if (image == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "신고 증빙 사진을 찾을 수 없습니다.");
        }

        Path imagePath = communityReportImageStorage.findOwnedFile(
                image.getImageUrl()
        );

        if (imagePath == null) {
            throw new ApiException(ErrorCode.NOT_FOUND, "신고 증빙 사진 파일을 찾을 수 없습니다.");
        }

        return imagePath;
    }
}
