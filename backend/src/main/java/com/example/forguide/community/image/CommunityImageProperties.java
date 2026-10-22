package com.example.forguide.community.image;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "forguide.community-image")

public record CommunityImageProperties(String dir) {

    public CommunityImageProperties {
        if (dir == null || dir.isBlank()) {
            dir = "uploads/community-images";
        }
    }
}
