package com.example.forguide.community.report;

// 처리 전 신고자와 신고 번호만 관리자 처리 흐름에 전달한다.
public record CommunityReportRecipient(
        Long reportId,
        Long reporterMemberId,
        CommunityReportResourceType resourceType,
        Long resourceId
) {
}