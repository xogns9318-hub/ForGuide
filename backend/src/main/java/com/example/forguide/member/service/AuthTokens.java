package com.example.forguide.member.service;

import com.example.forguide.member.dto.AuthResponse;

/**
 * 서비스가 컨트롤러에 넘기는 발급 결과. refreshToken(원문)은 쿠키로만 내보내고 응답 본문에는 넣지 않는다.
 */
public record AuthTokens(AuthResponse body, String refreshToken) {
}
