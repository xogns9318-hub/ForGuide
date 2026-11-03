package com.example.forguide.admin.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminDashboardResponse {

    private long memberCount;
    private long postCount;
    private long commentCount;
}
