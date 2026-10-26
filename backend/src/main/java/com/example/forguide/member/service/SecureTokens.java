package com.example.forguide.member.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/**
 * 회원 기능에서 쓰는 비밀값 도구 (refresh token, 이메일 인증 코드·토큰 공통)
 * - DB에는 원문 대신 sha256 해시만 저장한다
 * - 해시 비교는 시간 차이가 나지 않는 방식(matches)으로 한다
 */
final class SecureTokens {

    private static final SecureRandom RANDOM = new SecureRandom();

    private SecureTokens() {
    }

    /** 무작위 bytes바이트를 URL에 넣을 수 있는 문자열로 (쿠키·JSON에 그대로 쓸 수 있게) */
    static String random(int bytes) {
        byte[] value = new byte[bytes];
        RANDOM.nextBytes(value);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    /** 000000~999999 (앞자리 0 포함 6자리) */
    static String sixDigits() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    /** SHA-256 해시 (16진수 64자) */
    static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", e);
        }
    }

    /** 두 해시가 같은지 (비교 시간이 내용에 따라 달라지지 않는다) */
    static boolean matches(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
