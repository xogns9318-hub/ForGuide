package com.example.forguide.community.report;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

// HTTP 요청값과 DB 저장용 생성 결과를 분리해, 생성된 신고 번호를 이미지 저장에 사용한다.
@Getter
@RequiredArgsConstructor
public class CommunityReportCreateCommand {

    private final Long reporterMemberId;
    private final CommunityReportResourceType resourceType;
    private final Long resourceId;
    private final CommunityReportReason reportReason;

    @Setter
    private Long reportId;
}
