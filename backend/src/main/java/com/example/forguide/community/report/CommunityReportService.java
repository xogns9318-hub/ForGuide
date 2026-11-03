package com.example.forguide.community.report;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.community.dto.CommunityCommentResponse;
import com.example.forguide.community.dto.CommunityPostResponse;
import com.example.forguide.community.mapper.CommunityMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityReportService {

    private final CommunityMapper communityMapper;
    private final CommunityReportMapper communityReportMapper;

    public CommunityReportService(
            CommunityMapper communityMapper,
            CommunityReportMapper communityReportMapper
    ) {
        this.communityMapper = communityMapper;
        this.communityReportMapper = communityReportMapper;
    }

    @Transactional
    public void reportPost(Long postId, Long reporterMemberId, CommunityReportCreateRequest request) {
        CommunityPostResponse post = communityMapper.findPostById(postId);
        validateTarget(post, reporterMemberId);
        create(reporterMemberId, CommunityReportResourceType.POST, postId, request.getReportReason());
    }

    @Transactional
    public void reportComment(Long postId, Long commentId, Long reporterMemberId, CommunityReportCreateRequest request) {
        CommunityCommentResponse comment = communityMapper.findCommentById(commentId);

        if (comment == null || !postId.equals(comment.getPostId()) || comment.isDeleted()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "신고할 댓글을 찾을 수 없습니다.");
        }

        validateTarget(comment.getMemberId(), reporterMemberId);
        create(reporterMemberId, CommunityReportResourceType.COMMENT, commentId, request.getReportReason());
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
            CommunityReportReason reportReason
    ) {
        try {
            communityReportMapper.insert(reporterMemberId, resourceType, resourceId, reportReason);
        } catch (DuplicateKeyException exception) {
            throw new ApiException(ErrorCode.INVALID_INPUT, "이미 신고한 콘텐츠입니다.");
        }
    }
}
