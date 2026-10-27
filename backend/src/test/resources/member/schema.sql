-- 인증 테스트 전용 스키마 (H2, MySQL 모드). 공용 DB의 members·refresh_tokens 구조를 따른다.
-- 테스트마다 새로 만든다.
DROP TABLE IF EXISTS member_profiles;
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

-- 프로필 선택지와 회원 프로필 (선택지 값은 V27과 같게)
DROP TABLE IF EXISTS visa_types;
DROP TABLE IF EXISTS residence_types;

CREATE TABLE residence_types (
    residence_type_id BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    residence_code    VARCHAR(30)  NOT NULL UNIQUE,
    residence_name    VARCHAR(100) NOT NULL
);

CREATE TABLE visa_types (
    visa_type_id BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    visa_code    VARCHAR(30)  NOT NULL UNIQUE,
    visa_name    VARCHAR(100) NOT NULL
);

CREATE TABLE member_profiles (
    profile_id        BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
    member_id         BIGINT      NOT NULL UNIQUE,
    language          VARCHAR(10) NOT NULL DEFAULT 'ko',
    residence_type_id BIGINT,
    visa_type_id      BIGINT,
    job               VARCHAR(50),
    updated_at        DATETIME    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_member_profiles_member FOREIGN KEY (member_id) REFERENCES members (member_id),
    CONSTRAINT fk_member_profiles_residence_type FOREIGN KEY (residence_type_id) REFERENCES residence_types (residence_type_id),
    CONSTRAINT fk_member_profiles_visa_type FOREIGN KEY (visa_type_id) REFERENCES visa_types (visa_type_id),
    CONSTRAINT chk_profile_language CHECK (language IN ('ko', 'zh', 'vi', 'en', 'ja', 'th'))
);

INSERT INTO visa_types (visa_code, visa_name) VALUES
    ('E-9', '비전문취업(E-9)'), ('H-2', '방문취업(H-2)'), ('PROFESSIONAL', '전문인력'), ('STUDENT', '유학생'),
    ('F-4', '재외동포(F-4)'), ('F-5', '영주(F-5)'), ('F-6', '결혼이민(F-6)'), ('OTHER', '기타');

INSERT INTO residence_types (residence_code, residence_name) VALUES
    ('KOREAN', '내국인'), ('FOREIGN_RESIDENT', '등록 외국인(장기체류)'), ('FOREIGN_SHORT_TERM', '단기체류 외국인');
