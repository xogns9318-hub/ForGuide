package com.example.forguide.member.mapper;

import lombok.Getter;
import lombok.Setter;

/**
 * member_profiles 한 행. 체류 유형·체류자격은 번호 대신 코드(residence_types·visa_types)로 들고 있다.
 */
@Getter
@Setter
public class MemberProfileRow {

    private String language;
    private String residenceTypeCode; // 없을 수 있음
    private String visaTypeCode;      // 없을 수 있음 (내국인은 항상 없음)
    private String job;               // 없을 수 있음
}
