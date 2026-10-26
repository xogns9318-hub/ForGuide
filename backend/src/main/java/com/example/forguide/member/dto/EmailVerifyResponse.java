package com.example.forguide.member.dto;

/** 인증 완료 토큰: 가입(또는 비밀번호 재설정) 요청에 함께 보낸다. 30분 안에 한 번만 쓸 수 있다 */
public record EmailVerifyResponse(String verificationToken) {
}
