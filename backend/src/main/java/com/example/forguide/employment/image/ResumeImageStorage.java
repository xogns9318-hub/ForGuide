package com.example.forguide.employment.image;

import com.example.forguide.common.image.ImageFileValidator;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/**
 * 이력서 증명사진 검사·저장·삭제를 담당한다.
 */
@Component
public class ResumeImageStorage {

    public static final String STORAGE_PREFIX = "/resume-images/";

    // 증명사진 한 장은 최대 4MB로 제한한다.
    private static final long MAX_BYTES = 4L * 1024 * 1024;

    private final Path directory;

    public ResumeImageStorage(ResumeImageProperties properties) {
        this.directory = Path.of(properties.dir()).toAbsolutePath().normalize();
    }

    public Path getDirectory() {
        return directory;
    }

    // 유효한 이미지인지 검사한 뒤 무작위 파일명으로 저장한다.
    public String store(MultipartFile file) {
        ImageFileValidator.ValidatedImage image =
                ImageFileValidator.validate(file, MAX_BYTES);

        String fileName = UUID.randomUUID() + "." + image.extension();

        try {
            Files.createDirectories(directory);
            Files.write(directory.resolve(fileName), image.bytes());
        } catch (IOException e) {
            throw new IllegalStateException("이력서 사진을 저장하지 못했습니다.", e);
        }

        return STORAGE_PREFIX  + fileName;
    }

    // 저장소가 만든 사진 키일 때만 실제 파일 경로를 돌려줌
    public Path findOwnedFile(String photoUrl) {
        if (photoUrl == null || !photoUrl.startsWith(STORAGE_PREFIX)) {
            return null;
        }

        Path target = directory
                .resolve(photoUrl.substring(STORAGE_PREFIX.length()))
                .normalize();

        // 경로 조작과 없는 파일을 모두 차단
        if (!target.getParent().equals(directory)
                || !Files.isRegularFile(target)) {
            return null;
        }

        return target;
    }

    // 이력서 사진 저장소가 만든 주소일 때만 삭제한다.
    public void deleteIfOwned(String photoUrl) {
        if (photoUrl == null || !photoUrl.startsWith(STORAGE_PREFIX )) {
            return;
        }

        Path target = directory
                .resolve(photoUrl.substring(STORAGE_PREFIX .length()))
                .normalize();

        // 경로 조작으로 저장 폴더 밖의 파일을 지우지 못하게 막는다.
        if (!target.getParent().equals(directory)) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // 이전 사진 삭제 실패가 이력서 저장 자체를 막지는 않는다.
        }
    }
}