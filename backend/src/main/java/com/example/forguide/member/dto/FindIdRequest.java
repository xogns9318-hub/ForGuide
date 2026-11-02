package com.example.forguide.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 아이디 찾기 요청. 이메일 인증(FIND_ID)으로 받은 토큰이 있어야 한다.
 */
public record FindIdRequest(

        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식으로 입력해주세요.")
        String email,

        @NotBlank(message = "이메일 인증을 완료해주세요.")
        String verificationToken) {
}
