package com.example.forguide.inquiry.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InquiryImageResponse {

    private Long inquiryImageId;
    private Long inquiryId;
    private Integer displayOrder;

    // 서버 파일 경로는 응답에 노출하지 않고, 권한 검사 뒤 파일 API에서만 사용한다.
    @JsonIgnore
    private String imageUrl;
}
