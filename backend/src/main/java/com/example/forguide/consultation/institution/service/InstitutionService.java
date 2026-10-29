package com.example.forguide.consultation.institution.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.consultation.institution.dto.InstitutionDocument;
import com.example.forguide.consultation.institution.mapper.InstitutionMapper;
import java.util.List;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

// 기관 조회 중 데이터를 변경하지 않는다.
@Service
public class InstitutionService {

    private final InstitutionMapper mapper;
    private final ObjectMapper objectMapper;

    public InstitutionService(
            InstitutionMapper mapper,
            ObjectMapper objectMapper
    ) {
        this.mapper = mapper;
        this.objectMapper = objectMapper;
    }

    // 초기 15개 기관의 실제 DB 자료를 반환한다.
    // 검색·정렬은 프론트 API 모듈에서 처리한다.
    // 서버 오류를 가짜 기관이나 빈 결과로 대체하지 않는다.
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

    // DB의 구조화된 JSON을 DTO로 읽어 응답 모양을 고정한다.
    private InstitutionDocument read(String document) {
        return objectMapper.readValue(
                document,
                InstitutionDocument.class
        );
    }
}