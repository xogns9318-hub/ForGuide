package com.example.forguide.member.dto;

import com.example.forguide.member.mapper.MemberProfileRow;
import java.util.List;

/**
 * 로그인한 본인의 프로필과 고를 수 있는 선택지. 아직 저장한 적이 없으면 값은 모두 null이다.
 * 체류 유형·체류자격은 코드로 주고받는다 (이름은 choices에서 찾는다).
 */
public record MemberProfileResponse(
        String language,
        String residenceTypeCode,
        String visaTypeCode,
        String job,
        Choices choices) {

    /** 선택지 하나 (코드, 화면 표시 이름) */
    public record Choice(String code, String name) {
    }

    public record Choices(List<String> languages, List<Choice> residenceTypes, List<Choice> visaTypes) {
    }

    public static MemberProfileResponse of(MemberProfileRow row, Choices choices) {
        if (row == null) {
            return new MemberProfileResponse(null, null, null, null, choices);
        }
        return new MemberProfileResponse(row.getLanguage(), row.getResidenceTypeCode(), row.getVisaTypeCode(),
                row.getJob(), choices);
    }
}
