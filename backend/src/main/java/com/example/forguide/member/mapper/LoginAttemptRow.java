package com.example.forguide.member.mapper;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * login_attempts 테이블 한 행: 아이디별 연속 로그인 실패 기록
 */
@Getter
@Setter
public class LoginAttemptRow {

    private String loginId;
    private int failedCount;
    private LocalDateTime lastFailedAt;
    private LocalDateTime lockedUntil;
}
