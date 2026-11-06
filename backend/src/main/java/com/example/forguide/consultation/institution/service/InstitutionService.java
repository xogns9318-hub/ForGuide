package com.example.forguide.consultation.institution.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.consultation.institution.dto.InstitutionDocument;
import com.example.forguide.consultation.institution.mapper.InstitutionMapper;
import com.example.forguide.translation.cache.TranslationCacheResource;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import com.example.forguide.translation.dto.TranslationTargetRequest;
import com.example.forguide.translation.service.TranslationService;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

// 기관 조회 중 데이터를 변경하지 않는다.
@Service
public class InstitutionService {

    private final InstitutionMapper mapper;
    private final ObjectMapper objectMapper;
    private final TranslationService translationService;

    public InstitutionService(
            InstitutionMapper mapper,
            ObjectMapper objectMapper,
            TranslationService translationService
    ) {
        this.mapper = mapper;
        this.objectMapper = objectMapper;
        this.translationService = translationService;
    }

    // 초기 15개 기관의 실제 DB 자료를 반환한다.
    // 검색·정렬은 프론트 API 모듈에서 처리한다.
    // 서버 오류를 가짜 기관이나 빈 결과로 대체하지 않는다.

    /**
     *
     * @return
     */
    public List<InstitutionDocument> findAll() {
        return mapper.findAllDocuments()
                .stream()
                .map(this::read)
                .toList();
    }

    // 잘못된 번호와 존재하지 않는 기관을 구분한다.
    public InstitutionDocument findById(long id) {
        if (id < 1) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }

        String document = mapper.findDocumentById(id);

        if (document == null) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }

        return read(document);
    }

    public TranslationResponse translateText(
            long id,
            String field,
            TranslationTargetRequest request
    ) {
        InstitutionDocument institution = findById(id);
        String sourceText = getTranslatableText(institution, field);

        TranslationRequest translationRequest = new TranslationRequest();
        // 현재 기관 안내 원문은 한국어 DB 자료이므로 원본 언어를 명시한다.
        translationRequest.setSourceLanguage("ko");
        translationRequest.setTargetLanguage(request.getTargetLanguage());
        translationRequest.setSourceText(sourceText);

        return translationService.translatePublicText(
                translationRequest,
                new TranslationCacheResource(
                        "institution-" + field,
                        id,
                        createContentVersion(sourceText)
                )
        );
    }

    private String getTranslatableText(
            InstitutionDocument institution,
            String field
    ) {
        if (field.startsWith("service-guide-")) {
            return requireTranslatableText(
                    getServiceGuideText(institution, field)
            );
        }

        String sourceText = switch (field) {
            case "description" -> institution.description();
            case "target" -> institution.targetDescription();
            case "notes" -> institution.additionalNotes();
            // 목록 카드와 상세의 긴 운영 안내만 한 번에 번역한다.
            case "guidance" -> getGuidanceText(institution.guidance());
            // 상세의 상담 범위 안내는 서비스 설명을 묶어 번역한다.
            case "scope-notes" -> joinTexts(
                    institution.services().stream()
                            .flatMap(service -> Arrays.stream(new String[]{
                                    service.summary(),
                                    service.description(),
                            }))
                            .toArray(String[]::new)
            );
            default -> throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "지원하지 않는 기관 번역 항목입니다."
            );
        };

        return requireTranslatableText(sourceText);
    }

    private String getServiceGuideText(
            InstitutionDocument institution,
            String field
    ) {
        String serviceIdText = field.substring("service-guide-".length());

        long serviceId;
        try {
            serviceId = Long.parseLong(serviceIdText);
        } catch (NumberFormatException exception) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "지원하지 않는 기관 번역 항목입니다."
            );
        }

        InstitutionDocument.ServiceDocument service = institution.services().stream()
                .filter(candidate -> candidate.id() == serviceId)
                .findFirst()
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        return joinTexts(
                service.summary(),
                service.description(),
                service.targetDescription(),
                service.languageNotes(),
                service.contactDescription()
        );
    }

    private String getGuidanceText(InstitutionDocument.Guidance guidance) {
        if (guidance == null) {
            return "";
        }

        return joinTexts(
                guidance.location(),
                guidance.methods(),
                guidance.reservation(),
                guidance.preparation(),
                guidance.phoneLanguages(),
                guidance.visitLanguages(),
                guidance.phoneWeekend(),
                guidance.phoneHoliday(),
                guidance.visitWeekend(),
                guidance.visitHoliday()
        );
    }

    private String joinTexts(String... values) {
        return Arrays.stream(values)
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining("\n\n"));
    }

    private String requireTranslatableText(String sourceText) {
        if (sourceText == null || sourceText.isBlank()) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "번역할 기관 안내가 없습니다."
            );
        }

        return sourceText;
    }

    private int createContentVersion(String sourceText) {
        // 소개 문장이 수정되면 다른 버전 키를 써서 기존 번역을 재사용하지 않는다.
        return Math.floorMod(sourceText.hashCode(), Integer.MAX_VALUE - 1) + 1;
    }

    // DB의 구조화된 JSON을 DTO로 읽어 응답 모양을 고정한다.
    private InstitutionDocument read(String document) {
        return objectMapper.readValue(
                document,
                InstitutionDocument.class
        );
    }
}
