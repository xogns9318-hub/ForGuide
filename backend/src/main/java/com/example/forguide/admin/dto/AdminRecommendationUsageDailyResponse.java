package com.example.forguide.admin.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AdminRecommendationUsageDailyResponse {

    private LocalDate usageDate;

    private long totalUsageCount;
    private long loanUsageCount;
    private long insuranceUsageCount;
    private long accountUsageCount;
}
