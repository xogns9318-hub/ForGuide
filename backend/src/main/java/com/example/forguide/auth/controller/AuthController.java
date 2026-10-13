package com.example.forguide.auth.controller;

import com.example.forguide.auth.common.ApiResponse;
import com.example.forguide.auth.dto.AuthResponse;
import com.example.forguide.auth.dto.LoginIdCheckResponse;
import com.example.forguide.auth.dto.LoginRequest;
import com.example.forguide.auth.dto.MemberResponse;
import com.example.forguide.auth.dto.SignupRequest;
import com.example.forguide.auth.jwt.JwtProperties;
import com.example.forguide.auth.service.AuthService;
import com.example.forguide.auth.service.AuthTokens;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 회원가입·로그인·재발급·로그아웃 (로그인 없이 호출 가능: SecurityConfig에서 /api/v1/auth/** 공개)
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    // refresh token 쿠키 이름과 경로 (재발급·로그아웃 요청에만 실리게 /api/v1/auth로 제한)
    static final String REFRESH_COOKIE = "refreshToken";
    private static final String REFRESH_COOKIE_PATH = "/api/v1/auth";

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    public AuthController(AuthService authService, JwtProperties jwtProperties) {
        this.authService = authService;
        this.jwtProperties = jwtProperties;
    }

    @GetMapping("/check-login-id")
    public ApiResponse<LoginIdCheckResponse> checkLoginId(@RequestParam String loginId) {
        return ApiResponse.ok(new LoginIdCheckResponse(authService.isLoginIdAvailable(loginId)));
    }

    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<MemberResponse>> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(authService.signup(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return withRefreshCookie(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        return withRefreshCookie(authService.refresh(refreshToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        authService.logout(refreshToken);
        // 브라우저의 쿠키도 지운다 (Max-Age=0)
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", Duration.ZERO).toString())
                .body(ApiResponse.ok());
    }

    // 응답 본문에는 access token만, refresh token은 HttpOnly 쿠키로
    private ResponseEntity<ApiResponse<AuthResponse>> withRefreshCookie(AuthTokens tokens) {
        ResponseCookie cookie = refreshCookie(tokens.refreshToken(), jwtProperties.refreshTokenValidity());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.ok(tokens.body()));
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)                        // JavaScript에서 읽을 수 없다
                .secure(jwtProperties.cookieSecure())  // true면 https에서만 전송 (배포 시 켠다)
                .sameSite("Strict")                    // 다른 사이트에서 시작된 요청에는 실리지 않는다
                .path(REFRESH_COOKIE_PATH)             // 재발급·로그아웃 요청에만 실린다
                .maxAge(maxAge)
                .build();
    }
}
