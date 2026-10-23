package com.example.forguide.consultation.institution.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.consultation.institution.dto.InstitutionDocument;
import com.example.forguide.consultation.institution.service.InstitutionService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 목록과 상세는 같은 기관 ID를 사용한다.
@RestController
@RequestMapping("/api/v1/consultation/institutions")
public class InstitutionController {

    private final InstitutionService service;

    public InstitutionController(InstitutionService service) {
        this.service = service;
    }

    // 조건이 없는 목록 요청은 전체 실제 기관을 반환한다.
    @GetMapping
    public ApiResponse<List<InstitutionDocument>> list() {
        return ApiResponse.ok(service.findAll());
    }

    // 상세 자료도 DB에서 조회한다.
    @GetMapping("/{id}")
    public ApiResponse<InstitutionDocument> detail(
            @PathVariable("id") long id
    ) {
        return ApiResponse.ok(service.findById(id));
    }
}