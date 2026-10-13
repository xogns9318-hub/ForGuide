package com.example.forguide.auth.image;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 프로필 이미지 저장 설정.
 *
 * <pre>
 * forguide.profile-image.dir  저장할 서버 폴더 (기본: 실행 위치 기준 uploads/profile-images)
 * </pre>
 */
@ConfigurationProperties(prefix = "forguide.profile-image")
public record ProfileImageProperties(String dir) {

    public ProfileImageProperties {
        if (dir == null || dir.isBlank()) dir = "uploads/profile-images";
    }
}
