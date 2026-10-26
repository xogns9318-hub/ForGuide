-- 이메일 인증 코드와 인증 완료 토큰을 저장합니다 (회원가입·비밀번호 찾기 공통).
-- 보안: 코드와 토큰은 원문이 아니라 SHA-256 해시만 저장합니다.
-- 버전 번호: 다른 브랜치가 V22·V23을 쓰고 있어 V24 다음인 V25로 둡니다.
CREATE TABLE email_verifications (
    verification_id   BIGINT       NOT NULL AUTO_INCREMENT,
    email             VARCHAR(255) NOT NULL,
    purpose           VARCHAR(20)  NOT NULL,
    code_hash         CHAR(64)     NOT NULL,
    expires_at        DATETIME     NOT NULL,
    failed_attempts   INT          NOT NULL DEFAULT 0,
    verified_at       DATETIME     NULL,
    token_hash        CHAR(64)     NULL,
    token_expires_at  DATETIME     NULL,
    token_used_at     DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (verification_id),
    UNIQUE KEY uk_email_verifications_token_hash (token_hash),
    KEY idx_email_verifications_email_purpose (email, purpose, created_at),
    CONSTRAINT chk_email_verifications_purpose CHECK (purpose IN ('SIGNUP', 'PASSWORD_RESET'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
