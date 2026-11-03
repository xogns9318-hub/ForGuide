package com.example.forguide.admin.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AdminMemberResponse {

    private Long memberId;
    private String loginId;
    private String name;
    private String nickname;
    private String email;
    private String role;
    private AdminMemberStatus memberStatus;
    private LocalDateTime createdAt;
    private LocalDateTime suspendedAt;
}