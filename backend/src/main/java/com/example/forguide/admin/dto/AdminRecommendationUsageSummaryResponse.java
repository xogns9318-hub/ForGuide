package com.example.forguide.admin.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminRecommendationUsageSummaryResponse {

    private long totalUsageCount;
    private long loanUsageCount;
    private long insuranceUsageCount;
    private long accountUsageCount;

    private long productResultCount;
    private long consultationRedirectCount;

    private LocalDateTime latestUsedAt;
}
