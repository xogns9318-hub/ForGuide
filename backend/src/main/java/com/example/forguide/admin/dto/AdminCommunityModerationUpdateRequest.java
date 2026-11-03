package com.example.forguide.admin.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminCommunityModerationUpdateRequest(
        @NotNull(message = "변경할 공개 상태가 필요합니다.")
        AdminCommunityModerationStatus moderationStatus,

        @Size(max = 500, message = "관리 사유는 500자 이하여야 합니다.")
        String reason
) {
}