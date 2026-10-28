package com.example.forguide.member.dto;

/** 비밀번호 재설정 결과: 로그인 화면에 미리 채울 아이디 (이메일 주인임을 확인한 사람에게만 준다) */
public record PasswordResetResponse(String loginId) {
}
