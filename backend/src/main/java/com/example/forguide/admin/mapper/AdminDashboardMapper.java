package com.example.forguide.admin.mapper;

import com.example.forguide.admin.dto.AdminDashboardResponse;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AdminDashboardMapper {

    // 관리자 대시보드에 필요한 운영 현황 수치를 한 번에 조회한다.
    AdminDashboardResponse findDashboard();
}