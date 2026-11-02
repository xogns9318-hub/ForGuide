package com.example.forguide.member.dto;

import com.example.forguide.member.dto.MemberProfileResponse.Choice;
import com.example.forguide.member.mapper.CustomerFinanceRow;
import java.util.List;

/**
 * 로그인한 본인의 금융 정보와 고를 수 있는 선택지. 모르는(저장하지 않은) 값은 null이다.
 * visaTypeCode는 프로필의 체류자격(비자)이고, 내국인이면 visaApplicable이 false다 (화면에서 숨김).
 */
public record FinanceResponse(
        Long annualIncome,
        String employmentTypeCode,
        String creditScoreBand,
        String mainBank,
        Long existingLoanAmount,
        String visaTypeCode,
        boolean visaApplicable,
        Choices choices) {

    /**
     * 선택지. 고용 형태·신용점수 구간은 코드만 주고 표시 문구는 화면 번역이 정한다.
     * 주거래은행·체류자격은 { code, name } (은행 이름은 추천 데이터와 같고, OTHER·NONE이 끝에 붙는다)
     */
    public record Choices(List<String> employmentTypes, List<String> creditScoreBands,
                          List<Choice> banks, List<Choice> visaTypes) {
    }

    public static FinanceResponse of(CustomerFinanceRow row, String visaTypeCode, boolean visaApplicable,
                                     Choices choices) {
        if (row == null) {
            return new FinanceResponse(null, null, null, null, null, visaTypeCode, visaApplicable, choices);
        }
        return new FinanceResponse(row.getAnnualIncome(), row.getEmploymentTypeCode(), row.getCreditScoreBand(),
                row.getMainBank(), row.getExistingLoanAmount(), visaTypeCode, visaApplicable, choices);
    }
}
