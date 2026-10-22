package com.example.forguide.consultation.institution.dto;

import java.util.List;

// DB 조회 결과를 공개 API의 고정된 구조로 읽는다.
// 운영 여부는 1=운영 확인, 0=미운영 확인, null=미확인으로 보존한다.
public record InstitutionDocument(
        long id,
        String code,
        String name,
        String description,
        String phone,
        String websiteUrl,
        String address,
        String targetDescription,
        String additionalNotes,
        List<String> featuredKeywords,
        List<String> aliases,
        List<PhoneContact> additionalPhones,
        List<String> sourceUrls,
        String verificationStatus,
        String checkedAt,
        List<ServiceDocument> services
) {
    // 대표번호와 용도가 다른 연락처를 구분한다.
    public record PhoneContact(
            String phone,
            String label,
            String notes
    ) {}

    // 분야·역할·실제 키워드는 같은 상담 업무 안에서 관리한다.
    // 준비 목록 번호가 없으면 구비서류를 임의로 추측하지 않는다.
    public record ServiceDocument(
            long id,
            String topic,
            String name,
            String summary,
            String description,
            String targetDescription,
            String role,
            List<String> keywords,
            Phone phone,
            Visit visit,
            Online online,
            SpecialPhone specialPhone,
            List<Language> languages,
            List<Region> regions,
            String languageNotes,
            String contactDescription,
            Long preparationListId,
            String sourceUrl,
            String checkedAt
    ) {}

    // 전화 운영정보를 방문 운영정보와 분리한다.
    public record Phone(
            Integer available,
            String number,
            String hours,
            Integer weekend,
            Integer holiday,
            String regionStatus
    ) {}

    // 예약 가능 여부와 예약 필수 여부는 서로 다른 정보다.
    public record Visit(
            Integer available,
            String address,
            String hours,
            Integer weekend,
            Integer holiday,
            Integer reservationAvailable,
            Integer reservationRequired,
            String reservationUrl,
            String branchInformation
    ) {}

    public record Online(
            Integer available,
            String url
    ) {}

    // 특별 시간은 scope에 적힌 업무에만 적용한다.
    public record SpecialPhone(
            String hours,
            String scope,
            Integer weekend,
            Integer holiday
    ) {}

    // 같은 언어라도 전화·방문 지원 여부를 혼합하지 않는다.
    public record Language(
            String code,
            String method,
            String description
    ) {}

    // 지역은 실제 상담 방식과 함께 전달한다.
    // 방문 장소가 다른 지역 거주자의 이용 불가를 뜻하지는 않는다.
    public record Region(
            String province,
            String district,
            String method
    ) {}
}