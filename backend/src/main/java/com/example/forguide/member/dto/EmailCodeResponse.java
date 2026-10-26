package com.example.forguide.member.dto;

/** 인증 코드 발송 결과: 코드 유효 시간과 다시 보낼 수 있을 때까지의 시간(초) */
public record EmailCodeResponse(long expiresInSeconds, long resendAfterSeconds) {
}
