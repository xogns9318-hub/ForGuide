package com.example.forguide.admin.dto;


import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminCommunityContentCursorRequest {

    // POST 또는 COMMENT만 따로 볼 때 사용하고, null이면 모두 조회한다.
    private AdminCommunityResourceType resourceType;

    // VISIBLE 또는 HIDDEN만 따로 볼 때 사용하고, null이면 모두 조회한다.
    private AdminCommunityModerationStatus moderationStatus;

    // 게시글,댓글 본문과 작성자 정보 검색에 사용한다.
    private String keyword;

    // 다음 목록 조회용 복합 커서: 작성 시각 + 콘텐츠 종류 + 콘텐츠 번호
    private LocalDateTime cursorCreatedAt;
    private AdminCommunityResourceType cursorResourceType;
    private Long cursorResourceId;

    @Min(value = 1, message = "목록 크기는 1 이상이어야 합니다.")
    @Max(value = 50, message = "목록 크기는 50 이하여야 합니다.")
    private int size = 20;

}
