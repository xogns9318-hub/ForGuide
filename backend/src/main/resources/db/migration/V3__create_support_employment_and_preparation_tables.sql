-- 상담기관, 취업 안내, 준비 목록의 상세 테이블입니다.

CREATE TABLE support_institutions (
    institution_id BIGINT NOT NULL AUTO_INCREMENT,
    institution_name VARCHAR(150) NOT NULL,
    institution_type VARCHAR(50) NULL,
    logo_url VARCHAR(1000) NULL,
    region_id BIGINT NULL,
    address VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    opening_hours TEXT NULL,
    website_url VARCHAR(1000) NULL,
    is_example BOOLEAN NOT NULL DEFAULT TRUE,
    source_url VARCHAR(1000) NULL,
    as_of DATE NULL,
    collected_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    checked_at DATETIME NULL,
    PRIMARY KEY (institution_id),
    KEY idx_support_institutions_region_id (region_id),
    CONSTRAINT fk_support_institutions_region
        FOREIGN KEY (region_id) REFERENCES regions (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE institution_services (
    service_id BIGINT NOT NULL AUTO_INCREMENT,
    institution_id BIGINT NOT NULL,
    topic_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    summary VARCHAR(500) NULL,
    description TEXT NULL,
    target_description TEXT NULL,
    phone_available BOOLEAN NULL,
    phone VARCHAR(20) NULL,
    visit_available BOOLEAN NULL,
    visit_address VARCHAR(500) NULL,
    reservation_available BOOLEAN NULL,
    reservation_url VARCHAR(1000) NULL,
    contact_description TEXT NULL,
    opening_hours TEXT NULL,
    phone_hours TEXT NULL,
    language_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    region_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    list_id BIGINT NULL,
    display_order INT NOT NULL DEFAULT 0,
    source_url VARCHAR(1000) NULL,
    as_of DATE NULL,
    collected_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    checked_at DATETIME NULL,
    PRIMARY KEY (service_id),
    UNIQUE KEY uk_institution_services_list_id (list_id),
    KEY idx_institution_services_institution_id (institution_id),
    CONSTRAINT fk_institution_services_institution
        FOREIGN KEY (institution_id) REFERENCES support_institutions (institution_id),
    CONSTRAINT fk_institution_services_preparation_list
        FOREIGN KEY (list_id) REFERENCES preparation_lists (list_id),
    CONSTRAINT chk_service_topic CHECK (topic_code IN (
        'bank', 'loan', 'repayment', 'credit', 'living', 'wages',
        'employment_contract', 'retirement', 'employment', 'remittance',
        'payment', 'housing', 'tax', 'insurance', 'fraud',
        'financial_support', 'financial_information'
    )),
    CONSTRAINT chk_service_language_status CHECK (language_status IN ('published', 'unknown')),
    CONSTRAINT chk_service_region_status CHECK (region_status IN ('published', 'unrestricted', 'unknown'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE institution_service_languages (
    service_id BIGINT NOT NULL,
    language_code VARCHAR(35) NOT NULL,
    description TEXT NULL,
    PRIMARY KEY (service_id, language_code),
    CONSTRAINT fk_institution_service_languages_service
        FOREIGN KEY (service_id) REFERENCES institution_services (service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE institution_service_regions (
    service_id BIGINT NOT NULL,
    region_id BIGINT NOT NULL,
    PRIMARY KEY (service_id, region_id),
    KEY idx_institution_service_regions_region_id (region_id),
    CONSTRAINT fk_institution_service_regions_service
        FOREIGN KEY (service_id) REFERENCES institution_services (service_id),
    CONSTRAINT fk_institution_service_regions_region
        FOREIGN KEY (region_id) REFERENCES regions (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE employment_guides (
    guide_id BIGINT NOT NULL AUTO_INCREMENT,
    guide_code VARCHAR(80) NOT NULL,
    guide_type VARCHAR(30) NOT NULL,
    title_text_key VARCHAR(150) NOT NULL,
    content_text_key VARCHAR(150) NOT NULL,
    target_description TEXT NULL,
    visa_condition_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    list_id BIGINT NULL,
    is_example BOOLEAN NOT NULL DEFAULT TRUE,
    source_url VARCHAR(1000) NULL,
    as_of DATE NULL,
    collected_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    checked_at DATETIME NULL,
    updated_at DATETIME NULL,
    PRIMARY KEY (guide_id),
    UNIQUE KEY uk_employment_guides_code (guide_code),
    UNIQUE KEY uk_employment_guides_list_id (list_id),
    CONSTRAINT fk_employment_guides_preparation_list
        FOREIGN KEY (list_id) REFERENCES preparation_lists (list_id),
    CONSTRAINT chk_guide_visa_status CHECK (visa_condition_status IN ('published', 'unrestricted', 'unknown'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE employment_guide_visas (
    guide_id BIGINT NOT NULL,
    visa_type_id BIGINT NOT NULL,
    PRIMARY KEY (guide_id, visa_type_id),
    KEY idx_employment_guide_visas_visa_type_id (visa_type_id),
    CONSTRAINT fk_employment_guide_visas_guide
        FOREIGN KEY (guide_id) REFERENCES employment_guides (guide_id),
    CONSTRAINT fk_employment_guide_visas_visa_type
        FOREIGN KEY (visa_type_id) REFERENCES visa_types (visa_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE preparation_items (
    item_id BIGINT NOT NULL AUTO_INCREMENT,
    list_id BIGINT NOT NULL,
    item_code VARCHAR(80) NOT NULL,
    name_text_key VARCHAR(150) NOT NULL,
    description_text_key VARCHAR(150) NULL,
    instruction_text_key VARCHAR(150) NULL,
    requirement_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    display_order INT NOT NULL DEFAULT 0,
    source_url VARCHAR(1000) NULL,
    checked_at DATETIME NULL,
    PRIMARY KEY (item_id),
    UNIQUE KEY uk_preparation_items_list_code (list_id, item_code),
    CONSTRAINT fk_preparation_items_list
        FOREIGN KEY (list_id) REFERENCES preparation_lists (list_id),
    CONSTRAINT chk_preparation_requirement
        CHECK (requirement_status IN ('required', 'optional', 'conditional', 'unknown'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE preparation_checks (
    check_id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    is_checked BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (check_id),
    UNIQUE KEY uk_preparation_checks_member_item (member_id, item_id),
    KEY idx_preparation_checks_item_id (item_id),
    CONSTRAINT fk_preparation_checks_member
        FOREIGN KEY (member_id) REFERENCES members (member_id),
    CONSTRAINT fk_preparation_checks_item
        FOREIGN KEY (item_id) REFERENCES preparation_items (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
