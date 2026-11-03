package com.example.forguide.admin.controller;

import com.example.forguide.admin.dto.AdminDashboardResponse;
import com.example.forguide.admin.service.AdminDashboardService;
import com.example.forguide.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    // SecurityConfig의 /api/v1/admin/** 규칙이 ADMIN 권한을 검증
    @GetMapping
    public ApiResponse<AdminDashboardResponse> getDashboard() {
        return ApiResponse.ok(adminDashboardService.getDashboard());
    }
}
