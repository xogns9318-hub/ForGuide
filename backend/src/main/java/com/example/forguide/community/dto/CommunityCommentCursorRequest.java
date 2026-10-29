package com.example.forguide.community.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CommunityCommentCursorRequest {

    // 마지막으로 받은 최상위 댓글의 작성 시각
    private LocalDateTime cursorCreatedAt;

    // 작성 시각이 같은 댓글을 구분하는 보조 커서
    @Positive(message = "댓글 커서 번호가 올바르지 않습니다.")
    private Long cursorCommentId;

    // 한 번에 가져올 최상위 댓글 수
    @NotNull(message = "조회 개수가 필요합니다.")
    @Min(value = 1, message = "조회 개수는 1 이상이어야 합니다.")
    @Max(value = 50, message = "조회 개수는 최대 50개입니다.")
    private Integer size;
}
