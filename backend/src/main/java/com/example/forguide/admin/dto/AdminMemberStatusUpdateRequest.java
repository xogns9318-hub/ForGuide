package com.example.forguide.admin.dto;

import jakarta.validation.constraints.NotNull;

public record AdminMemberStatusUpdateRequest(
        @NotNull(message = "변경할 회원 상태가 필요합니다.")
        AdminMemberStatus memberStatus
) {
}