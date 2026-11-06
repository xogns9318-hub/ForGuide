package com.example.forguide.consultation.institution.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.consultation.institution.dto.InstitutionSearchCriteria;
import com.example.forguide.consultation.institution.service.InstitutionSearchService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/consultation/institutions/search")
public class InstitutionSearchController {

    private final InstitutionSearchService service;

    public InstitutionSearchController(InstitutionSearchService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<InstitutionSearchService.Result> search(
            @RequestParam(name = "query", defaultValue = "") String query,
            @RequestParam(name = "topic", defaultValue = "") String topic,
            @RequestParam(name = "keywords", required = false) List<String> keywords,
            @RequestParam(name = "province", defaultValue = "") String province,
            @RequestParam(name = "district", defaultValue = "") String district,
            @RequestParam(name = "language", defaultValue = "") String language,
            @RequestParam(name = "method", defaultValue = "") String method
    ) {
        // 화면의 조건을 입력 검증 → Elasticsearch 검색 → 결과 구성 순서로 전달한다.
        var criteria = new InstitutionSearchCriteria(
                query,
                topic,
                keywords,
                province,
                district,
                language,
                method
        );

        return ApiResponse.ok(service.search(criteria));
    }
}