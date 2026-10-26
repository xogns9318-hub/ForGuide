package com.example.forguide.member.mapper;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * email_verifications 테이블 한 행. 코드·토큰은 해시만 들고 있다.
 */
@Getter
@Setter
public class EmailVerificationRow {

    private Long verificationId;
    private String email;
    private String purpose;
    private String codeHash;
    private LocalDateTime expiresAt;
    private int failedAttempts;
    private LocalDateTime verifiedAt;
    private String tokenHash;
    private LocalDateTime tokenExpiresAt;
    private LocalDateTime tokenUsedAt;
    private LocalDateTime createdAt;
}
