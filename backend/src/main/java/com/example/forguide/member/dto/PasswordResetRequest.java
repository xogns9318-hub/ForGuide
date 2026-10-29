package com.example.forguide.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 비밀번호 찾기(재설정) 요청. 이메일 인증(PASSWORD_RESET)으로 받은 토큰이 있어야 한다.
 * 새 비밀번호는 회원가입과 같은 규칙(SignupRequest.PASSWORD_PATTERN)으로 검사한다.
 */
public record PasswordResetRequest(

        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식으로 입력해주세요.")
        String email,

        @NotBlank(message = "이메일 인증을 완료해주세요.")
        String verificationToken,

        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Pattern(regexp = SignupRequest.PASSWORD_PATTERN, message = SignupRequest.PASSWORD_MESSAGE)
        String newPassword) {
}
