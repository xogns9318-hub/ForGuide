package com.example.forguide.community.image;

import com.example.forguide.common.image.LocalImageStorage;
import org.springframework.stereotype.Component;

@Component
public class CommunityImageStorage extends LocalImageStorage {

    // 로그인 없이 조회 가능한 커뮤니티 이미지 URL
    public static final String URL_PREFIX = "/api/v1/community-images/";

    private static final long MAX_BYTES = 20L * 1024 * 1024;

    public CommunityImageStorage(
            CommunityImageProperties properties
    ) {
        super(
                properties.dir(),
                URL_PREFIX,
                MAX_BYTES,
                "게시글 사진을 저장하지 못했습니다."
        );
    }
}