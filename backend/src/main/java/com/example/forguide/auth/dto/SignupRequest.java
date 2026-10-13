package com.example.forguide.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * 회원가입 요청. 규칙은 프론트 src/auth/utils/authValidation.js와 같다 (화면 검사를 우회한 요청도 여기서 막는다).
 */
public record SignupRequest(

        @NotBlank(message = "아이디를 입력해주세요.")
        @Pattern(regexp = "^[a-z0-9]{4,20}$", message = "4~20자의 영문 소문자와 숫자만 사용할 수 있습니다.")
        String loginId,

        // 8~32자, 영문 소문자·대문자·숫자·특수문자 모두 포함, 공백·비영문 자판 문자 불가
        @NotBlank(message = "비밀번호를 입력해주세요.")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])[\\x21-\\x7E]{8,32}$",
                message = "비밀번호는 8~32자, 영문 소문자·대문자·숫자·특수문자를 모두 포함해야 합니다.")
        String password,

        @NotBlank(message = "이름을 입력해주세요.")
        @Size(max = 50, message = "50자 이하로 입력해주세요.")
        String name,

        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식으로 입력해주세요.")
        @Size(max = 254, message = "올바른 이메일 형식으로 입력해주세요.")
        String email) {
}
