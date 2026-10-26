-- 인증 테스트 전용 스키마 (H2, MySQL 모드). 공용 DB의 members·refresh_tokens 구조를 따른다.
-- 테스트마다 새로 만든다.
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS members;

CREATE TABLE members (
    member_id         BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    login_id          VARCHAR(50)   NOT NULL UNIQUE,
    password          VARCHAR(255)  NOT NULL,
    name              VARCHAR(101)  NOT NULL,
    given_name        VARCHAR(50),
    family_name       VARCHAR(50),
    nickname          VARCHAR(50),
    phone             VARCHAR(20)   UNIQUE,
    email             VARCHAR(255)  NOT NULL UNIQUE,
    birth             DATE,
    profile_image_url VARCHAR(1000),
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME
);

CREATE TABLE refresh_tokens (
    refresh_token_id BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id        BIGINT       NOT NULL,
    token            VARCHAR(255) NOT NULL UNIQUE,
    expires_at       DATETIME     NOT NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_member FOREIGN KEY (member_id) REFERENCES members (member_id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS email_verifications;

CREATE TABLE email_verifications (
    verification_id   BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email             VARCHAR(255) NOT NULL,
    purpose           VARCHAR(20)  NOT NULL,
    code_hash         CHAR(64)     NOT NULL,
    expires_at        DATETIME     NOT NULL,
    failed_attempts   INT          NOT NULL DEFAULT 0,
    verified_at       DATETIME,
    token_hash        CHAR(64)     UNIQUE,
    token_expires_at  DATETIME,
    token_used_at     DATETIME,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS login_attempts;

CREATE TABLE login_attempts (
    login_id        VARCHAR(20) NOT NULL PRIMARY KEY,
    failed_count    INT         NOT NULL,
    last_failed_at  DATETIME    NOT NULL,
    locked_until    DATETIME
);
