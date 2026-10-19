package com.example.forguide.community.image;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Iterator;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class CommunityImageStorage {

    /** 이미지 주소의 앞부분. 이 주소는 로그인 없이 조회할 수 있다 (SecurityConfig) */
    public static final String URL_PREFIX = "/api/v1/community-images/";

    static final long MAX_BYTES = 20L * 1024 * 1024;
    private static final int MAX_DIMENSION = 4096;

    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final Path directory;

    public CommunityImageStorage(CommunityImageProperties properties) {
        this.directory = Path.of(properties.dir()).toAbsolutePath().normalize();
    }

    public Path getDirectory() {
        return directory;
    }

    /** 검사 후 저장하고 접근 주소(/api/v1/community-images/{파일이름})를 돌려준다 */
    public String store(MultipartFile file) {
        byte[] bytes = readAll(file);
        String extension = detectExtension(bytes);
        checkDecodable(bytes);

        // 저장할 바이트 준비 (나중에 JPG 변환·크기 줄이기를 넣을 자리)
        byte[] toSave = bytes;

        String fileName = UUID.randomUUID() + "." + extension;
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
        if (imageUrl == null || !imageUrl.startsWith(URL_PREFIX)) return;

        Path target = directory.resolve(imageUrl.substring(URL_PREFIX.length())).normalize();
        if (!target.getParent().equals(directory)) return; // 폴더 밖을 가리키면 무시

        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // 이전 파일 삭제 실패는 새 이미지 저장을 막지 않는다
        }
    }

    private static byte[] readAll(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalid("이미지 파일을 선택해주세요.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw invalid(null);
        }
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw invalid(null);
        }
    }

    private static String detectExtension(byte[] bytes) {
        if (startsWith(bytes, JPEG_SIGNATURE)) return "jpg";
        if (startsWith(bytes, PNG_SIGNATURE)) return "png";
        throw invalid(null);
    }

    // 실제로 이미지로 열리는지, 크기가 허용 범위인지 (전체를 펼치기 전에 가로·세로만 먼저 읽는다)
    private static void checkDecodable(byte[] bytes) {
        try (InputStream in = new ByteArrayInputStream(bytes);
             ImageInputStream imageInput = ImageIO.createImageInputStream(in)) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) throw invalid(null);

            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInput);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width <= 0 || height <= 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
                    throw invalid("이미지는 가로·세로 " + MAX_DIMENSION + "px 이하로 올려주세요.");
                }
                reader.read(0); // 깨진 파일 걸러내기
            } finally {
                reader.dispose();
            }
        } catch (IOException | RuntimeException e) {
            if (e instanceof ApiException apiException) throw apiException;
            throw invalid(null);
        }
    }

    private static boolean startsWith(byte[] bytes, byte[] signature) {
        return bytes.length >= signature.length
                && Arrays.equals(Arrays.copyOf(bytes, signature.length), signature);
    }

    private static ApiException invalid(String message) {
        String text = (message != null) ? message : ErrorCode.INVALID_IMAGE.getDefaultMessage();
        return new ApiException(ErrorCode.INVALID_IMAGE, text, java.util.Map.of("image", text));
    }
}
