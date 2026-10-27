package com.example.forguide.translation.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TranslationRequest {

    // 지원 언어 또는 Gemini가 원문을 자동 감지하는 auto만 허용한다.
    @NotBlank(message = "원본 언어를 선택해주세요.")
    @Pattern(
            regexp = "auto|ko|en|ja|zh|vi|th",
            message = "지원하지 않는 원본 언어입니다."
    )
    private String sourceLanguage;

    @NotBlank(message = "번역할 언어를 선택해주세요.")
    @Pattern(
            regexp = "ko|en|ja|zh|vi|th",
            message = "지원하지 않는 번역 언어입니다."
    )
    private String targetLanguage;

    // 개인정보가 섞일 수 있는 긴 내용을 한 번에 과도하게 보내지 않도록 제한한다.
    @NotBlank(message = "번역할 내용을 입력해주세요.")
    @Size(max = 5000, message = "번역할 내용은 5,000자 이하로 입력해주세요.")
    private String sourceText;
}
