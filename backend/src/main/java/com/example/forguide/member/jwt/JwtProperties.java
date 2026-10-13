package com.example.forguide.member.jwt;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * application.properties의 jwt.* 설정값.
 *
 * <pre>
 * jwt.secret                 서명용 비밀키 (Base64, 디코딩 후 32바이트 이상). 저장소에 넣지 않고 환경변수 JWT_SECRET으로 받는다
 * jwt.access-token-validity  access token 수명 (예: 30m)
 * jwt.refresh-token-validity refresh token 수명 (예: 14d)
 * jwt.cookie-secure          refresh token 쿠키를 https에서만 보낼지 (로컬 http 개발은 false, 배포는 true)
 * </pre>
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
        String secret,
        Duration accessTokenValidity,
        Duration refreshTokenValidity,
        boolean cookieSecure) {

    // 설정이 빠졌을 때의 기본 수명 (팀에서 정한 값: access 30분, refresh 14일)
    private static final Duration DEFAULT_ACCESS_TOKEN_VALIDITY = Duration.ofMinutes(30);
    private static final Duration DEFAULT_REFRESH_TOKEN_VALIDITY = Duration.ofDays(14);

    public JwtProperties {
        if (accessTokenValidity == null) accessTokenValidity = DEFAULT_ACCESS_TOKEN_VALIDITY;
        if (refreshTokenValidity == null) refreshTokenValidity = DEFAULT_REFRESH_TOKEN_VALIDITY;
    }
}
