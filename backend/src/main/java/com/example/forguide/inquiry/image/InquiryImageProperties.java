package com.example.forguide.inquiry.image;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "forguide.inquiry-image")
public record InquiryImageProperties(String dir) {

    public InquiryImageProperties {
        if (dir == null || dir.isBlank()) {
            dir = "uploads/inquiry-images";
        }
    }
}
