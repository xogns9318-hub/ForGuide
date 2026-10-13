package com.example.forguide.auth.dto;

/**
 * 로그인·재발급 응답 본문. refresh token은 본문이 아니라 HttpOnly 쿠키로 내려준다.
 */
public record AuthResponse(String accessToken, MemberResponse member) {
}
