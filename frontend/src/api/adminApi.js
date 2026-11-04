import { client } from "./client.js";

// 관리자 대시보드의 운영 현황 수치를 조회한다.
export function getAdminDashboard() {
    return client.get("/admin/dashboard");
}

// 관리자가 선택한 기간의 추천 사용 현황을 조회한다.
export function getAdminRecommendationUsage(days = 30) {
    const params = new URLSearchParams({
        days: String(days),
    });

    return client.get(
        `/admin/recommendation-usage?${params.toString()}`,
    );
}

// 관리자는 문의 상태를 선택해 최신순으로 목록을 조회한다.
export function getAdminInquiries({
    cursorInquiryId = null,
    inquiryStatus = null,
    size = 10,
} = {}) {
    const params = new URLSearchParams();

    params.set("size", String(size));

    if (cursorInquiryId != null) {
        params.set("cursorInquiryId", String(cursorInquiryId));
    }

    if (inquiryStatus) {
        params.set("inquiryStatus", inquiryStatus);
    }

    return client.get(`/admin/inquiries?${params.toString()}`);
}

// 관리자가 답변을 등록하면 서버가 답벼나자,답변 시각,상태를 함께 기록한다.
export function answerAdminInquiry(inquiryId, answerContent) {
    return client.patch(`/admin/inquiries/${inquiryId}/answer`, {
        answerContent,
    });
}

// 관리자가 상태,검색어,커서 조건으로회원 목록을 조회한다.
export function getAdminMembers({
    cursorMemberId = null,
    memberStatus = null,
    keyword = null,
    size = 20,
} = {}) {
    const params = new URLSearchParams();

    params.set("size", String(size));

    if (cursorMemberId != null) {
        params.set("cursorMemberId", String(cursorMemberId));
    }

    if (memberStatus) {
        params.set("memberStatus", memberStatus);
    }

    if (keyword?.trim()) {
        params.set("keyword", keyword.trim());
    }

    return client.get(`/admin/members?${params.toString()}`);
}

// 관리자가 일반 회원을 정지하거나 다시 활성화한다.
export function updateAdminMemberStatus(memberId, memberStatus) {
    return client.patch(`/admin/members/${memberId}/status`, {
        memberStatus,
    });
}

// 관리자가 게시글, 댓글을 통합 목록으로 조회한다.
export function getAdminCommunityContents({
    cursorCreatedAt = null,
    cursorResourceType = null,
    cursorResourceId = null,
    resourceType = null,
    moderationStatus = null,
    keyword = null,
    size = 20,
} = {}) {
    const params = new URLSearchParams();
    params.set("size", String(size));

    if (cursorCreatedAt) {
        params.set("cursorCreatedAt", cursorCreatedAt);
    }

    if (cursorResourceType) {
        params.set("cursorResourceType", cursorResourceType);
    }

    if (cursorResourceId != null) {
        params.set("cursorResourceId", String(cursorResourceId));
    }

    if (resourceType) {
        params.set("resourceType", resourceType);
    }

    if (moderationStatus) {
        params.set("moderationStatus", moderationStatus);
    }

    if (keyword?.trim()) {
        params.set("keyword", keyword.trim());
    }

    return client.get(`/admin/community/contents?${params.toString()}`);
}

// 관리자가 콘텐츠를 숨기거나 다시 공개한다.
export function updateAdminCommunityModeration(
    resourceType, resourceId, moderationStatus, reason,
) {
    return client.patch(
        `/admin/community/contents/${resourceType}/${resourceId}/moderation`,
        {
            moderationStatus,
            reason: reason?.trim() || null,
        },
    );
}

// 관리자가 최근 커뮤니티 신고를 조회한다.
export function getAdminCommunityReports() {
    return client.get("/admin/community/reports");
}

// 신고 증빙 이미지 목록을 조회한다.
export function getAdminCommunityReportImages(reportId) {
    return client.get(`/admin/community/reports/${reportId}/images`);
}

// 관리자 권한으로 신고 증빙 이미지 파일을 받아온다.
export function getAdminCommunityReportImageBlob(
    reportId,
    reportImageId,
) {
    return client.getBlob(
        `/admin/community/reports/${reportId}/images/${reportImageId}`,
    );
}

// 관리자가 신고 한 건만 기각한다. 콘텐츠 공개 상태는 바꾸지 않는다.
export function dismissAdminCommunityReport(reportId) {
    return client.patch(
        `/admin/community/reports/${reportId}/dismiss`,
    );
}