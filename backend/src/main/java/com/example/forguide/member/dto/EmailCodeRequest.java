package com.example.forguide.member.dto;

import com.example.forguide.member.service.VerificationPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** 인증 코드 보내기 요청 */
public record EmailCodeRequest(
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식으로 입력해주세요.")
        @Size(max = 254, message = "올바른 이메일 형식으로 입력해주세요.")
        String email,

        @NotNull(message = "인증 목적을 선택해주세요.")
        VerificationPurpose purpose) {
}
