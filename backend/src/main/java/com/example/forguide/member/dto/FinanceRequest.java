package com.example.forguide.member.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * 내 금융 정보 저장 요청. 모든 항목이 선택이며, 모르면 비워 둔다(null → "확인 필요").
 * 금액은 원 단위 (화면은 만원으로 입력받아 바꿔 보낸다). 0은 "없음"으로 그대로 저장한다.
 * 코드가 선택지에 있는지는 MemberService에서 확인한다.
 * 체류자격(비자)은 프로필과 같은 값이라 프로필(member_profiles)에 저장한다.
 */
public record FinanceRequest(

        // 입력 실수를 막는 상한 (100억 원)
        @PositiveOrZero(message = "0 이상으로 입력해주세요.")
        @Max(value = 10_000_000_000L, message = "입력할 수 있는 범위를 넘었습니다.")
        Long annualIncome,

        String employmentTypeCode,

        String creditScoreBand,

        String mainBank,

        @PositiveOrZero(message = "0 이상으로 입력해주세요.")
        @Max(value = 10_000_000_000L, message = "입력할 수 있는 범위를 넘었습니다.")
        Long existingLoanAmount,

        String visaTypeCode) {
}
