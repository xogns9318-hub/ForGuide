-- 회원과 여러 기능이 함께 사용하는 기준 테이블입니다.

CREATE TABLE members (
    member_id BIGINT NOT NULL AUTO_INCREMENT,
    login_id VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    nickname VARCHAR(50) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NOT NULL,
    birth DATE NULL,
    profile_image_url VARCHAR(1000) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (member_id),
    UNIQUE KEY uk_members_login_id (login_id),
    UNIQUE KEY uk_members_phone (phone),
    UNIQUE KEY uk_members_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 로그인 갱신 토큰을 회원별로 저장합니다.
CREATE TABLE refresh_tokens (
    refresh_token_id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (refresh_token_id),
    UNIQUE KEY uk_refresh_tokens_token (token),
    KEY idx_refresh_tokens_member_id (member_id),
    CONSTRAINT fk_refresh_tokens_member
        FOREIGN KEY (member_id) REFERENCES members (member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE residence_types (
    residence_type_id BIGINT NOT NULL AUTO_INCREMENT,
    residence_code VARCHAR(30) NOT NULL,
    residence_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (residence_type_id),
    UNIQUE KEY uk_residence_types_code (residence_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE visa_types (
    visa_type_id BIGINT NOT NULL AUTO_INCREMENT,
    visa_code VARCHAR(30) NOT NULL,
    visa_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (visa_type_id),
    UNIQUE KEY uk_visa_types_code (visa_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE employment_types (
    employment_type_id BIGINT NOT NULL AUTO_INCREMENT,
    employment_code VARCHAR(30) NOT NULL,
    employment_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (employment_type_id),
    UNIQUE KEY uk_employment_types_code (employment_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE regions (
    region_id BIGINT NOT NULL AUTO_INCREMENT,
    parent_region_id BIGINT NULL,
    region_level VARCHAR(20) NOT NULL,
    region_code VARCHAR(50) NOT NULL,
    region_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (region_id),
    UNIQUE KEY uk_regions_code (region_code),
    CONSTRAINT fk_regions_parent
        FOREIGN KEY (parent_region_id) REFERENCES regions (region_id),
    CONSTRAINT chk_region_level
        CHECK ((region_level = 'province' AND parent_region_id IS NULL)
            OR (region_level = 'district' AND parent_region_id IS NOT NULL)),
    CONSTRAINT chk_region_parent
        CHECK (parent_region_id IS NULL OR parent_region_id <> region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 금융상품과 상담·취업 안내가 공통으로 연결하는 준비 목록입니다.
CREATE TABLE preparation_lists (
    list_id BIGINT NOT NULL AUTO_INCREMENT,
    list_name VARCHAR(150) NOT NULL,
    PRIMARY KEY (list_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE member_profiles (
    profile_id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'ko',
    residence_type_id BIGINT NULL,
    visa_type_id BIGINT NULL,
    job VARCHAR(50) NULL,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (profile_id),
    UNIQUE KEY uk_member_profiles_member_id (member_id),
    KEY idx_member_profiles_residence_type_id (residence_type_id),
    KEY idx_member_profiles_visa_type_id (visa_type_id),
    CONSTRAINT fk_member_profiles_member
        FOREIGN KEY (member_id) REFERENCES members (member_id),
    CONSTRAINT fk_member_profiles_residence_type
        FOREIGN KEY (residence_type_id) REFERENCES residence_types (residence_type_id),
    CONSTRAINT fk_member_profiles_visa_type
        FOREIGN KEY (visa_type_id) REFERENCES visa_types (visa_type_id),
    CONSTRAINT chk_profile_language
        CHECK (language IN ('ko', 'zh', 'vi', 'en', 'ja', 'th'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE customer_finances (
    finance_id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    annual_income BIGINT NULL,
    employment_type_id BIGINT NULL,
    existing_loan_amount BIGINT NULL,
    requested_amount BIGINT NULL,
    purpose_code VARCHAR(50) NULL,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (finance_id),
    UNIQUE KEY uk_customer_finances_member_id (member_id),
    KEY idx_customer_finances_employment_type_id (employment_type_id),
    CONSTRAINT fk_customer_finances_member
        FOREIGN KEY (member_id) REFERENCES members (member_id),
    CONSTRAINT fk_customer_finances_employment_type
        FOREIGN KEY (employment_type_id) REFERENCES employment_types (employment_type_id),
    CONSTRAINT chk_finance_income CHECK (annual_income IS NULL OR annual_income >= 0),
    CONSTRAINT chk_finance_debt CHECK (existing_loan_amount IS NULL OR existing_loan_amount >= 0),
    CONSTRAINT chk_finance_requested_amount CHECK (requested_amount IS NULL OR requested_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
