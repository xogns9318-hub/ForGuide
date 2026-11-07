package com.example.forguide.inquiry.image;

import com.example.forguide.common.image.LocalImageStorage;
import java.nio.file.Path;
import org.springframework.stereotype.Component;

@Component
public class InquiryImageStorage extends LocalImageStorage {

    // 문의 이미지는 인증된 문의 상세 API를 통해서만 반환한다.
    public static final String URL_PREFIX = "/api/v1/inquiry-images/";

    private static final long MAX_BYTES = 4L * 1024 * 1024;

    public InquiryImageStorage(InquiryImageProperties properties) {
        super(
                properties.dir(),
                URL_PREFIX,
                MAX_BYTES,
                "문의 사진을 저장하지 못했습니다."
        );
    }

    public Path findOwnedFile(String imageUrl) {
        return findExistingOwnedFile(imageUrl);
    }
}
