package com.example.forguide.consultation.preparation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 이름·성·생년월일은 받지 않고, 직접 입력한 상세 내용만 번역 요청에 포함한다.
public record PreparationTranslationRequest(
        @NotBlank(message = "번역할 상담 내용을 입력해주세요.")
        @Size(max = 300, message = "상담 내용은 300자 이하로 입력해주세요.")
        String sourceText
) {
}