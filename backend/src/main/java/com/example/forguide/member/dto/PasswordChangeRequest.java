package com.example.forguide.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 비밀번호 변경 요청. 새 비밀번호는 회원가입과 같은 규칙(SignupRequest.PASSWORD_PATTERN)으로 검사한다.
 */
public record PasswordChangeRequest(

        @NotBlank(message = "현재 비밀번호를 입력해주세요.")
        String currentPassword,

        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Pattern(regexp = SignupRequest.PASSWORD_PATTERN, message = SignupRequest.PASSWORD_MESSAGE)
        String newPassword) {
}
