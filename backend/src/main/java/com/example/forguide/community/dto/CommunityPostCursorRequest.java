package com.example.forguide.community.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CommunityPostCursorRequest {

    // 마지막으로 받은 게시글의 생성 시각과 번호
    // 첫 요청에서는 둘 다 NULL이다.
    private LocalDateTime cursorCreatedAt;

    @Min(value = 1, message = "올바른 게시글 커서 번호가 아닙니다.")
    private Long cursorPostId;

    // 전체 게시글에서는 사용하는 선택 필터
    private String category;

    @Size(max = 100, message = "검색어는 100자 이하여야 합니다.")
    private String keyword;

    private String topic;

    @NotNull(message = "조회할 게시글 수가 필요합니다.")
    @Min(value = 1, message = "조회할 게시글 수는 1개 이상이어야 합니다.")
    @Max(value = 50, message = "한 번에 최대 50개까지만 조회할 수 있습니다.")
    private Integer size;

}
