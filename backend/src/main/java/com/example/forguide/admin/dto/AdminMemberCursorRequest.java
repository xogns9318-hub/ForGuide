package com.example.forguide.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminMemberCursorRequest {

    // 첫 조회에는 null, 다음 조회부터 마지막 회원 번호를 전달한다.
    @Positive(message = "회원 커서 번호가 올바르지 않습니다.")
    private Long cursorMemberId;

    // 전체 상태를 보려면 null, 정상·정지 회원만 보려면 상태를 전달한다.
    private AdminMemberStatus memberStatus;

    // 아이디,이름,닉네임,이메일 검색어
    private String keyword;

    @NotNull(message = "조회할 회원 수가 필요합니다.")
    @Min(value = 1, message = "조회할 회원 수는 1명 이상이어야 합니다.")
    @Max(value = 50, message = "한 번에 최대 50명까지 조회할 수 있습니다.")
    private Integer size;
}
