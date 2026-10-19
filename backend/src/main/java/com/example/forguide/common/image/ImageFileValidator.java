package com.example.forguide.common.image;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Iterator;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.web.multipart.MultipartFile;

/**
 * 업로드 이미지 공통 검사. "올려도 되는 파일인지"만 판단하고, 저장·삭제는 각 기능의 저장소가 맡는다.
 *
 * 규칙
 * - JPG·PNG만, 1바이트 이상 maxBytes 이하 (용량 한도는 기능마다 달라 호출하는 쪽이 넘긴다)
 * - 파일 이름·확장자·Content-Type이 아니라 실제 파일 내용(시그니처)으로 형식을 판단한다
 * - 실제로 이미지로 열리는지, 가로·세로가 지나치게 크지 않은지 확인한다 (압축 폭탄 방지)
 *
 * 통과하지 못하면 INVALID_IMAGE(항목 "image")를 던진다.
 */
public final class ImageFileValidator {

    private static final int MAX_DIMENSION = 4096;

    private static final byte[] JPEG_SIGNATURE = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private ImageFileValidator() {
    }

    /** 검사한 파일 내용과 형식에 맞는 확장자(jpg·png) */
    public record ValidatedImage(byte[] bytes, String extension) {
    }

    /** 용량 → 형식(시그니처) → 실제로 열리는지 순서로 검사하고, 통과한 파일 내용을 돌려준다 */
    public static ValidatedImage validate(MultipartFile file, long maxBytes) {
        byte[] bytes = readAll(file, maxBytes);
        String extension = detectExtension(bytes);
        checkDecodable(bytes);
        return new ValidatedImage(bytes, extension);
    }

    private static byte[] readAll(MultipartFile file, long maxBytes) {
        if (file == null || file.isEmpty()) {
            throw invalid("이미지 파일을 선택해주세요.");
        }
        if (file.getSize() > maxBytes) {
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
