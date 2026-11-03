package com.example.forguide.admin.service;

import com.example.forguide.admin.dto.AdminRecommendationUsageDailyResponse;
import com.example.forguide.admin.dto.AdminRecommendationUsageResponse;
import com.example.forguide.admin.dto.AdminRecommendationUsageSummaryResponse;
import com.example.forguide.admin.mapper.AdminRecommendationUsageMapper;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminRecommendationUsageService {

    private static final Set<Integer> ALLOWED_PERIOD_DAYS = Set.of(7, 30, 90);
    private final AdminRecommendationUsageMapper recommendationUsageMapper;

    // 관리자 화면에서 사용할 기간별 추천 실행 현황을 조회한다.
    public AdminRecommendationUsageResponse getUsage(int periodDays) {
        validatePeriodDays(periodDays);

        LocalDate startDate = LocalDate.now().minusDays(periodDays - 1);
        LocalDateTime startedAt = startDate.atStartOfDay();

        AdminRecommendationUsageSummaryResponse summary =
                recommendationUsageMapper.findSummary(startedAt);

        Map<LocalDate, AdminRecommendationUsageDailyResponse> dailyUsageByDate =
                new HashMap<>();

        for (AdminRecommendationUsageDailyResponse dailyUsage
                : recommendationUsageMapper.findDailyUsage(startedAt)) {
            dailyUsageByDate.put(dailyUsage.getUsageDate(), dailyUsage);
        }

        List<AdminRecommendationUsageDailyResponse> dailyUsage =
                new ArrayList<>();

        for (int index = 0; index < periodDays; index++) {
            LocalDate usageDate = startDate.plusDays(index);

            dailyUsage.add(
                    dailyUsageByDate.getOrDefault(
                            usageDate,
                            createEmptyDailyUsage(usageDate)
                    )
            );
        }

        AdminRecommendationUsageResponse response =
                new AdminRecommendationUsageResponse();

        response.setPeriodDays(periodDays);
        response.setSummary(summary);
        response.setDailyUsage(dailyUsage);

        return response;
    }

    private void validatePeriodDays(int periodDays) {
        if (!ALLOWED_PERIOD_DAYS.contains(periodDays)) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "조회 기간은 7일, 30일, 90일 중 하나여야 합니다."
            );
        }
    }

    private AdminRecommendationUsageDailyResponse createEmptyDailyUsage(
            LocalDate usageDate
    ) {
        AdminRecommendationUsageDailyResponse response =
                new AdminRecommendationUsageDailyResponse();

        response.setUsageDate(usageDate);
        response.setTotalUsageCount(0);
        response.setLoanUsageCount(0);
        response.setInsuranceUsageCount(0);
        response.setAccountUsageCount(0);

        return response;
    }
}
