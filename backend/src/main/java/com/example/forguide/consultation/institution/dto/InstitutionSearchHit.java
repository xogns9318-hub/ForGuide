package com.example.forguide.consultation.institution.dto;

import java.util.Set;

// 기관 자체에 검색어가 맞았는지와, 일치한 상담 업무 ID를 구분한다.
public record InstitutionSearchHit(
        InstitutionDocument institution,
        boolean institutionMatched,
        Set<Long> serviceIds
) {
    public InstitutionSearchHit {
        serviceIds = Set.copyOf(serviceIds);
    }
}