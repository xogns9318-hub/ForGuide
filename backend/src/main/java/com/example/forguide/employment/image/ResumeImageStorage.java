package com.example.forguide.employment.image;

import com.example.forguide.common.image.LocalImageStorage;
import java.nio.file.Path;
import org.springframework.stereotype.Component;

@Component
public class ResumeImageStorage extends LocalImageStorage {

    public static final String STORAGE_PREFIX = "/resume-images/";

    // 증명사진 한 장은 최대 4MB로 제한한다.
    private static final long MAX_BYTES = 4L * 1024 * 1024;

    public ResumeImageStorage(
            ResumeImageProperties properties
    ) {
        super(
                properties.dir(),
                STORAGE_PREFIX,
                MAX_BYTES,
                "이력서 사진을 저장하지 못했습니다."
        );
    }

    // 이력서 사진 주소이고 실제 파일이 존재할 때만 경로를 반환한다.
    public Path findOwnedFile(String photoUrl) {
        return findExistingOwnedFile(photoUrl);
    }
}