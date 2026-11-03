package com.example.forguide.community.report;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityReportCreateRequest {

    @NotNull(message = "신고 사유를 선택해주세요.")
    private CommunityReportReason reportReason;
}
