package com.example.forguide.admin.dto;

import com.example.forguide.community.report.CommunityReportReason;
import com.example.forguide.community.report.CommunityReportResourceType;
import com.example.forguide.community.report.CommunityReportStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminCommunityReportResponse {

    private Long reportId;
    private CommunityReportResourceType resourceType;
    private Long resourceId;
    private CommunityReportReason reportReason;
    private CommunityReportStatus reportStatus;

    private Long reporterMemberId;
    private String reporterLoginId;
    private String reporterNickname;

    private LocalDateTime createdAt;

    private Long targetMemberId;
    private String targetLoginId;
    private String targetNickname;

    private Long handledByMemberId;
    private String handledByLoginId;
    private String handledByNickname;
    private LocalDateTime handledAt;
}
