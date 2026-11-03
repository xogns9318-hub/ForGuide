package com.example.forguide.admin.service;

import com.example.forguide.admin.dto.AdminDashboardResponse;
import com.example.forguide.admin.mapper.AdminDashboardMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final AdminDashboardMapper adminDashboardMapper;

    public AdminDashboardResponse getDashboard() {
        return adminDashboardMapper.findDashboard();
    }
}
