package com.example.forguide.inquiry.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InquiryCursorRequest {

    // 첫 조회에서는 null, 다음 조회부터 마지막 문의 번호를 전달한다.
    @Positive(message = "문의 커서 번호가 올바르지 않습니다.")
    private Long cursorInquiryId;

    // 관리자는 접수 상태별 목록을 볼 수 있고, 내 문의 목록에서는 비워 둔다.
    private InquiryStatus inquiryStatus;

    @NotNull(message = "조회할 문의 수가 필요합니다.")
    @Min(value = 1, message = "조회할 문의 수는 1개 이상이어야 합니다.")
    @Max(value = 50, message = "한 번에 최대 50개까지만 조회할 수 있습니다.")
    private Integer size;
}