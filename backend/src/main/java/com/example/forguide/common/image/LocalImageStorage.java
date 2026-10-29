package com.example.forguide.common.image;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

public abstract class LocalImageStorage {

    private static final Logger log =
            LoggerFactory.getLogger(LocalImageStorage.class);

    private final Path directory;
    private final String urlPrefix;
    private final long maxBytes;
    private final String storeFailureMessage;

    protected LocalImageStorage(
            String directoryPath,
            String urlPrefix,
            long maxBytes,
            String storeFailureMessage
    ) {
        this.directory = Path.of(directoryPath)
                .toAbsolutePath()
                .normalize();
        this.urlPrefix = urlPrefix;
        this.maxBytes = maxBytes;
        this.storeFailureMessage = storeFailureMessage;
    }

    public final Path getDirectory() {
        return directory;
    }

    // 공통 검사 후 무작위 파일명으로 저장한다.
    public final String store(MultipartFile file) {
        ImageFileValidator.ValidatedImage image =
                ImageFileValidator.validate(file, maxBytes);

        String fileName = UUID.randomUUID()
                + "."
                + image.extension();

        try {
            Files.createDirectories(directory);
            Files.write(directory.resolve(fileName), image.bytes());
        } catch (IOException exception) {
            throw new IllegalStateException(
                    storeFailureMessage,
                    exception
            );
        }

        return urlPrefix + fileName;
    }

    // 우리 저장소 URL인지와 폴더 내부 경로인지를 함께 확인한다.
    protected final Path resolveOwnedFile(String imageUrl) {        if (imageUrl == null || !imageUrl.startsWith(urlPrefix)) {
            return null;
        }

        Path target = directory
                .resolve(imageUrl.substring(urlPrefix.length()))
                .normalize();

        if (!target.getParent().equals(directory)) {
            return null;
        }

        return target;
    }

    // DB 커밋 뒤 호출된다. 실패해도 DB 작업은 되돌리지 못하므로 서버 로그로 남긴다.
    public final void deleteIfOwned(String imageUrl) {
        Path target = resolveOwnedFile(imageUrl);

        if (target == null) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException exception) {
            log.warn(
                    "서버 이미지 파일 삭제에 실패했습니다. url={}",
                    imageUrl,
                    exception
            );
        }
    }

    protected final Path findExistingOwnedFile(String imageUrl) {
        Path target = resolveOwnedFile(imageUrl);

        if (target == null || !Files.isRegularFile(target)) {
            return null;
        }

        return target;
    }
}