package com.example.forguide.community.image;

import com.example.forguide.common.image.ImageFileValidator;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class CommunityImageStorage {

    /** 이미지 주소의 앞부분. 이 주소는 로그인 없이 조회할 수 있다 (SecurityConfig) */
    public static final String URL_PREFIX = "/api/v1/community-images/";

    static final long MAX_BYTES = 20L * 1024 * 1024;

    private final Path directory;

    public CommunityImageStorage(CommunityImageProperties properties) {
        this.directory = Path.of(properties.dir()).toAbsolutePath().normalize();
    }

    public Path getDirectory() {
        return directory;
    }

    /** 공통 이미지 검사 후 저장하고 접근 주소를 돌려준다 */
    public String store(MultipartFile file) {
        ImageFileValidator.ValidatedImage image = ImageFileValidator.validate(
                file,
                MAX_BYTES
        );

        // 저장할 바이트 준비 (나중에 JPG 변환·크기 줄이기를 넣을 자리)
        byte[] toSave = image.bytes();

        String fileName = UUID.randomUUID() + "." + image.extension();

        try {
            Files.createDirectories(directory);
            Files.write(directory.resolve(fileName), toSave);
        } catch (IOException e) {
            throw new IllegalStateException("게시글 사진을 저장하지 못했습니다.", e);
        }

        return URL_PREFIX + fileName;
    }

    /** 이전 이미지 삭제. 우리가 만든 주소일 때만, 저장 폴더 안의 파일만 지운다 */
    public void deleteIfOwned(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(URL_PREFIX)) {
            return;
        }

        Path target = directory
                .resolve(imageUrl.substring(URL_PREFIX.length()))
                .normalize();

        if (!target.getParent().equals(directory)) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // 이전 파일 삭제 실패는 새 이미지 저장을 막지 않는다.
        }
    }
}