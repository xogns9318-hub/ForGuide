package com.example.forguide.inquiry.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class InquiryResponse {

    private Long inquiryId;

    // 관리자 목록에서 문의 작성자를 식별할 때 사용한다.
    private Long memberId;
    private String memberNickname;

    private InquiryCategory inquiryCategory;
    private String title;
    private String content;

    private InquiryStatus inquiryStatus;
    private String answerContent;
    private Long answeredByMemberId;
    private LocalDateTime answeredAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
