package com.example.forguide.community.report;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityReportImageResponse {

    private Long reportImageId;
    private Long reportId;
    private String imageUrl;
    private int displayOrder;
}
