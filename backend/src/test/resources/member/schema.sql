-- 인증 테스트 전용 스키마 (H2, MySQL 모드). 공용 DB의 members·refresh_tokens 구조를 따른다.
-- 테스트마다 새로 만든다.
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS members;

CREATE TABLE members (
    member_id         BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    login_id          VARCHAR(50)   NOT NULL UNIQUE,
    password          VARCHAR(255)  NOT NULL,
    name              VARCHAR(50)   NOT NULL,
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
