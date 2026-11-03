package com.example.forguide.inquiry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InquiryCreateRequest {

    // INSERT 뒤 첨부 이미지 행을 연결하기 위해 MyBatis가 생성한 번호를 보관한다.
    private Long inquiryId;

    @NotNull(message = "문의 유형을 선택해주세요.")
    private InquiryCategory inquiryCategory;

    @NotBlank(message = "문의 제목을 입력해주세요.")
    @Size(max = 200, message = "문의 제목은 200자 이하여야 합니다.")
    private String title;

    @NotBlank(message = "문의 내용을 입력해주세요.")
    @Size(max = 5000, message = "문의 내용은 5000자 이하여야 합니다.")
    private String content;
}
