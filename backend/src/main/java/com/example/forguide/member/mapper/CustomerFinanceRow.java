package com.example.forguide.member.mapper;

import lombok.Getter;
import lombok.Setter;

/**
 * customer_finances 한 행 (내 금융 정보). 모르는 값은 null — 0과 구분한다.
 * 금액은 원 단위, 고용 형태는 번호 대신 코드(employment_types)로 들고 있다.
 */
@Getter
@Setter
public class CustomerFinanceRow {

    private Long annualIncome;        // 연 소득 (원)
    private String employmentTypeCode;
    private String creditScoreBand;   // GT900 ~ LE300
    private String mainBank;          // 은행 이름, OTHER, NONE
    private Long existingLoanAmount;  // 기존 대출 (원)
}
