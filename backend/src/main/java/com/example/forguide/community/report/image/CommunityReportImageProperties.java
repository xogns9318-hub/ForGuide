package com.example.forguide.community.report.image;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "forguide.community-report-image")
public record CommunityReportImageProperties(String dir) {

    public CommunityReportImageProperties {
        if (dir == null || dir.isBlank()) {
            dir = "uploads/community-report-images";
        }
    }
}
