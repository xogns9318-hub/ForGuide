package com.example.forguide.member.mapper;

import java.time.LocalDateTime;

/** login_attempts 한 행: 아이디별 연속 로그인 실패 기록 */
public class LoginAttemptRow {

    private String loginId;
    private int failedCount;
    private LocalDateTime lastFailedAt;
    private LocalDateTime lockedUntil;

    public String getLoginId() {
        return loginId;
    }

    public void setLoginId(String loginId) {
        this.loginId = loginId;
    }

    public int getFailedCount() {
        return failedCount;
    }

    public void setFailedCount(int failedCount) {
        this.failedCount = failedCount;
    }

    public LocalDateTime getLastFailedAt() {
        return lastFailedAt;
    }

    public void setLastFailedAt(LocalDateTime lastFailedAt) {
        this.lastFailedAt = lastFailedAt;
    }

    public LocalDateTime getLockedUntil() {
        return lockedUntil;
    }

    public void setLockedUntil(LocalDateTime lockedUntil) {
        this.lockedUntil = lockedUntil;
    }
}
