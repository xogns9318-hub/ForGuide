package com.example.forguide.community.report.image;

import com.example.forguide.common.image.LocalImageStorage;
import java.nio.file.Path;
import org.springframework.stereotype.Component;

@Component
public class CommunityReportImageStorage extends LocalImageStorage {

    // 신고 증빙은 공개 정적 경로가 아니라 권한을 확인하는 API로만 반환한다.
    public static final String URL_PREFIX = "/api/v1/community-report-images/";

    private static final long MAX_BYTES = 4L * 1024 * 1024;

    public CommunityReportImageStorage(
            CommunityReportImageProperties properties
    ) {
        super(
                properties.dir(),
                URL_PREFIX,
                MAX_BYTES,
                "신고 증빙 사진을 저장하지 못했습니다."
        );
    }

    public Path findOwnedFile(String imageUrl) {
        return findExistingOwnedFile(imageUrl);
    }
}
