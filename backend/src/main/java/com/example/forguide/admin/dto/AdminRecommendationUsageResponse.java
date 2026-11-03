package com.example.forguide.admin.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AdminRecommendationUsageResponse {

    // 관리자 화면에서 선택한 조회 기간: 7, 30, 90일 중 하나
    private int periodDays;
    private AdminRecommendationUsageSummaryResponse summary;
    private List<AdminRecommendationUsageDailyResponse> dailyUsage;
}
