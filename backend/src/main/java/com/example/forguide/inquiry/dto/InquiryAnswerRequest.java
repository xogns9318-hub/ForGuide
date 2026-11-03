package com.example.forguide.inquiry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InquiryAnswerRequest {

    @NotBlank(message = "답변 내용을 입력해주세요.")
    @Size(max = 5000, message = "답변 내용은 5000자 이하여야 합니다.")
    private String answerContent;
}