package com.example.forguide.admin.controller;

import com.example.forguide.admin.dto.AdminRecommendationUsageResponse;
import com.example.forguide.admin.service.AdminRecommendationUsageService;
import com.example.forguide.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/recommendation-usage")
@RequiredArgsConstructor
public class AdminRecommendationUsageController {

    private final AdminRecommendationUsageService recommendationUsageService;

    // 기본 30일이며, Service에서 7,30,90일만 허용한다.
    @GetMapping
    public ApiResponse<AdminRecommendationUsageResponse> getUsage(
            @RequestParam(defaultValue = "30") int days
    ) {
        return ApiResponse.ok(
                recommendationUsageService.getUsage(days)
        );
    }
}
