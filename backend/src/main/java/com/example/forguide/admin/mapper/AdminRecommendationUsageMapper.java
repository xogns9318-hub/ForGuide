package com.example.forguide.admin.mapper;

import com.example.forguide.admin.dto.AdminRecommendationUsageDailyResponse;
import com.example.forguide.admin.dto.AdminRecommendationUsageSummaryResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface AdminRecommendationUsageMapper {

    // 선택한 기간의 전체,종류별 추천 실행 요약을 조회한다.
    AdminRecommendationUsageSummaryResponse findSummary(
            @Param("startedAt")LocalDateTime startedAt
    );

    // 차트에 표시할 날짜별 추천 실행 수를 조회한다.
    List<AdminRecommendationUsageDailyResponse> findDailyUsage(
            @Param("startedAt") LocalDateTime startedAt
    );
}
