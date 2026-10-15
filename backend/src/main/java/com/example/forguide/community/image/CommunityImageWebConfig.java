package com.example.forguide.community.image;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableConfigurationProperties(CommunityImageProperties.class)
public class CommunityImageWebConfig implements WebMvcConfigurer {

    private final CommunityImageStorage storage;

    public CommunityImageWebConfig(CommunityImageStorage storage) {
        this.storage = storage;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 폴더 위치는 "/"로 끝나야 그 안의 파일로 인식된다 (폴더가 아직 없으면 toUri()가 "/"를 붙이지 않음)
        String location = storage.getDirectory().toUri().toString();
        if (!location.endsWith("/")) location += "/";

        registry.addResourceHandler(CommunityImageStorage.URL_PREFIX + "**")
                .addResourceLocations(location);
    }
}
