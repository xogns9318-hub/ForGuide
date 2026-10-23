package com.example.forguide.employment.image;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 이력서 증명사진 저장 설정.
 *
 * <pre>
 * forguide.resume-image.dir  저장할 서버 폴더
 * 기본값: 실행 위치 기준 uploads/resume-images
 * </pre>
 */
@ConfigurationProperties(prefix = "forguide.resume-image")
public record ResumeImageProperties(String dir) {

    public ResumeImageProperties {
        if (dir == null || dir.isBlank()) {
            dir = "uploads/resume-images";
        }
    }
}