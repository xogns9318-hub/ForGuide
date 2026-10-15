package com.example.forguide.member.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 로그인 요청. 가입 규칙을 드러내지 않도록 빈 값만 확인한다.
 */
public record LoginRequest(
        @NotBlank(message = "아이디를 입력해주세요.") String loginId,
        @NotBlank(message = "비밀번호를 입력해주세요.") String password) {
}
