package com.example.forguide.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 프로필 저장 요청. 사용 언어는 필수, 나머지는 모르면 비워 둔다(null).
 * 코드가 선택지에 있는지는 MemberService에서 확인한다 (선택지는 DB 표에 있다).
 */
public record MemberProfileRequest(

        @NotBlank(message = "사용 언어를 선택해주세요.")
        String language,

        String residenceTypeCode,

        String visaTypeCode,

        @Size(max = 50, message = "50자 이하로 입력해주세요.")
        String job) {
}
