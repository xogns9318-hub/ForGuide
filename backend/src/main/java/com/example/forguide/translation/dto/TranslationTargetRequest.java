package com.example.forguide.translation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TranslationTargetRequest {

    // 번역할 게시글의 원문과 원문 언어는 서버가 postId로 직접 조회
    @NotBlank(message = "번역할 언어를 선택해주세요.")
    @Pattern(
            regexp = "ko|en|ja|zh|vi|th",
            message = "지원하지 않는 번역 언어입니다."
    )
    private String targetLanguage;
}
