package com.example.forguide.member.jwt;

import com.example.forguide.member.common.ApiException;
import com.example.forguide.member.common.ErrorCode;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Component;

/**
 * access token(JWT) 만들기·검증하기.
 * 토큰 내용에는 회원 번호(sub)와 발급·만료 시각만 넣는다. 내용은 누구나 읽을 수 있으므로 개인정보는 넣지 않는다.
 */
@Component
public class JwtProvider {

    // HMAC-SHA 서명에 필요한 최소 키 길이 (256비트)
    private static final int MIN_KEY_BYTES = 32;

    private final SecretKey key;
    private final Duration accessTokenValidity;
    private final Duration refreshTokenValidity;

    public JwtProvider(JwtProperties properties) {
        this.key = createKey(properties.secret());
        this.accessTokenValidity = requirePositive(properties.accessTokenValidity(), "jwt.access-token-validity");
        this.refreshTokenValidity = requirePositive(properties.refreshTokenValidity(), "jwt.refresh-token-validity");
    }

    /** 회원 번호로 access token 발급 */
    public String createAccessToken(Long memberId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(memberId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenValidity)))
                .signWith(key)
                .compact();
    }

    /**
     * access token을 검증하고 회원 번호를 꺼낸다.
     * 만료 → TOKEN_EXPIRED (프론트가 재발급을 시도), 위조·형식 오류 → TOKEN_INVALID
     */
    public Long getMemberId(String token) {
        try {
            String subject = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getSubject();
            return Long.valueOf(subject);
        } catch (ExpiredJwtException e) {
            throw new ApiException(ErrorCode.TOKEN_EXPIRED);
        } catch (JwtException | IllegalArgumentException e) {
            // 서명 불일치·형식 오류·sub가 숫자가 아님 등
            throw new ApiException(ErrorCode.TOKEN_INVALID);
        }
    }

    /** refresh token 만료 시각 계산과 쿠키 Max-Age에 쓴다 */
    public Duration getRefreshTokenValidity() {
        return refreshTokenValidity;
    }

    // 비밀키는 Base64 문자열로 받는다. 없거나 짧으면 서버를 띄우지 않는다 (약한 키로 서명하지 않기 위해)
    private static SecretKey createKey(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "jwt.secret이 없습니다. 환경변수 JWT_SECRET에 Base64 비밀키(32바이트 이상)를 설정하세요.");
        }
        byte[] bytes;
        try {
            bytes = Decoders.BASE64.decode(secret.trim());
        } catch (RuntimeException e) {
            throw new IllegalStateException("jwt.secret은 Base64 문자열이어야 합니다.");
        }
        if (bytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException("jwt.secret은 디코딩 후 32바이트 이상이어야 합니다.");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    private static Duration requirePositive(Duration value, String name) {
        if (value == null || value.isZero() || value.isNegative()) {
            throw new IllegalStateException(name + "은 0보다 커야 합니다.");
        }
        return value;
    }
}
