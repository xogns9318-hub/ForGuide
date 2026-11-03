package com.example.forguide.consultation.preparation.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.consultation.preparation.dto.PreparationTranslationRequest;
import com.example.forguide.consultation.preparation.service.PreparationTranslationService;
import com.example.forguide.translation.dto.TranslationResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/consultation/preparation-card")
public class PreparationCardController {
    private final PreparationTranslationService translationService;

    public PreparationCardController(PreparationTranslationService translationService) {
        this.translationService = translationService;
    }

    @PostMapping("/translation")
    public ApiResponse<TranslationResponse> translate(
            @Valid @RequestBody PreparationTranslationRequest request
    ) {
        // 상세 내용만 번역하며 원문과 번역문을 DB·Redis에 저장하지 않는다.
        return ApiResponse.ok(translationService.translate(request.sourceText()));
    }
}