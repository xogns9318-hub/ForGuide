package com.example.forguide.member.image;

import com.example.forguide.common.image.LocalImageStorage;
import org.springframework.stereotype.Component;

@Component
public class ProfileImageStorage extends LocalImageStorage {

    // 로그인 없이 조회 가능한 프로필 이미지 URL
    public static final String URL_PREFIX = "/api/v1/profile-images/";

    private static final long MAX_BYTES = 4L * 1024 * 1024;

    public ProfileImageStorage(
            ProfileImageProperties properties
    ) {
        super(
                properties.dir(),
                URL_PREFIX,
                MAX_BYTES,
                "프로필 이미지를 저장하지 못했습니다."
        );
    }
}