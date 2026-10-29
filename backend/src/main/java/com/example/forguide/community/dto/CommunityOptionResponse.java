package com.example.forguide.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityOptionResponse {

    // DB의 식별 코드: FREE_TALK, LOAN, EMPLOYMENT_GUIDE 등
    private String code;

    // 프론트 i18next에서 표시 문구를 찾는 키
    private String labelKey;

    // 화면에서 표시할 순서
    private Integer displayOrder;
}
