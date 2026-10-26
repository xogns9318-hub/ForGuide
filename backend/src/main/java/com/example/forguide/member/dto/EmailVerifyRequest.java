package com.example.forguide.member.dto;

import com.example.forguide.member.service.VerificationPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** 인증 코드 확인 요청 */
public record EmailVerifyRequest(
        @NotBlank(message = "이메일을 입력해주세요.")
        String email,

        @NotNull(message = "인증 목적을 선택해주세요.")
        VerificationPurpose purpose,

        @NotBlank(message = "인증 코드를 입력해주세요.")
        @Pattern(regexp = "^\s*[0-9]{6}\s*$", message = "인증 코드는 6자리 숫자입니다.")
        String code) {
}
