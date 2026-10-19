package com.example.forguide.member.image;

import com.example.forguide.common.image.ImageFileValidator;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * 프로필 이미지 검사·저장·삭제 (서버 폴더).
 *
 * 규칙 (프론트 src/auth/utils/profileImage.js와 같다)
 * - JPG·PNG만, 1바이트 이상 4MB 이하
 * - 형식·열림·가로세로 검사는 공통 검사(common/image/ImageFileValidator)를 쓴다
 * - 저장 이름은 무작위로 만든다. 사용자가 보낸 파일 이름은 쓰지 않는다 (경로 조작 방지)
 *
 * 나중에 JPG 자동 변환을 넣을 때는 store() 안의 "저장할 바이트 준비" 부분만 바꾸면 된다.
 */
@Component
public class ProfileImageStorage {

    /** 이미지 주소의 앞부분. 이 주소는 로그인 없이 조회할 수 있다 (SecurityConfig) */
    public static final String URL_PREFIX = "/api/v1/profile-images/";

    static final long MAX_BYTES = 4L * 1024 * 1024;

    private final Path directory;

    public ProfileImageStorage(ProfileImageProperties properties) {
        this.directory = Path.of(properties.dir()).toAbsolutePath().normalize();
    }

    public Path getDirectory() {
        return directory;
    }

    /** 검사 후 저장하고 접근 주소(/api/v1/profile-images/{파일이름})를 돌려준다 */
    public String store(MultipartFile file) {
        ImageFileValidator.ValidatedImage image = ImageFileValidator.validate(file, MAX_BYTES);

        // 저장할 바이트 준비 (나중에 JPG 변환·크기 줄이기를 넣을 자리)
        byte[] toSave = image.bytes();

        String fileName = UUID.randomUUID() + "." + image.extension();
        try {
            Files.createDirectories(directory);
            Files.write(directory.resolve(fileName), toSave);
        } catch (IOException e) {
            throw new IllegalStateException("프로필 이미지를 저장하지 못했습니다.", e);
        }
        return URL_PREFIX + fileName;
    }

    /** 이전 이미지 삭제. 우리가 만든 주소일 때만, 저장 폴더 안의 파일만 지운다 */
    public void deleteIfOwned(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(URL_PREFIX)) return;

        Path target = directory.resolve(imageUrl.substring(URL_PREFIX.length())).normalize();
        if (!target.getParent().equals(directory)) return; // 폴더 밖을 가리키면 무시

        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // 이전 파일 삭제 실패는 새 이미지 저장을 막지 않는다
        }
    }
}
