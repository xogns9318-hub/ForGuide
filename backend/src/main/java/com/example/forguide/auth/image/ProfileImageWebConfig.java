package com.example.forguide.auth.image;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 서버 폴더에 저장한 프로필 이미지를 /api/v1/profile-images/{파일이름} 주소로 내려준다.
 * 조회만 가능하며 로그인 없이 열린다 (SecurityConfig의 공개 주소).
 */
@Configuration
@EnableConfigurationProperties(ProfileImageProperties.class)
public class ProfileImageWebConfig implements WebMvcConfigurer {

    private final ProfileImageStorage storage;

    public ProfileImageWebConfig(ProfileImageStorage storage) {
        this.storage = storage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 폴더 위치는 "/"로 끝나야 그 안의 파일로 인식된다 (폴더가 아직 없으면 toUri()가 "/"를 붙이지 않음)
        String location = storage.getDirectory().toUri().toString();
        if (!location.endsWith("/")) location += "/";

        registry.addResourceHandler(ProfileImageStorage.URL_PREFIX + "**")
                .addResourceLocations(location);
    }
}
