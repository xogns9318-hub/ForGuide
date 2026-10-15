-- 금융기관과 대출·계좌·보험 상품 테이블입니다.

CREATE TABLE financial_institutions (
    institution_id BIGINT NOT NULL AUTO_INCREMENT,
    institution_name VARCHAR(150) NOT NULL,
    institution_type VARCHAR(50) NULL,
    logo_url VARCHAR(1000) NULL,
    website_url VARCHAR(1000) NULL,
    phone VARCHAR(20) NULL,
    is_example BOOLEAN NOT NULL DEFAULT TRUE,
    source_url VARCHAR(1000) NULL,
    checked_at DATETIME NULL,
    PRIMARY KEY (institution_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE financial_products (
    product_id BIGINT NOT NULL AUTO_INCREMENT,
    institution_id BIGINT NULL,
    product_type VARCHAR(20) NOT NULL,
    product_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_category VARCHAR(80) NULL,
    summary VARCHAR(500) NULL,
    description LONGTEXT NULL,
    target_description TEXT NULL,
    cost_description TEXT NULL,
    terms_url VARCHAR(1000) NULL,
    official_product_url VARCHAR(1000) NULL,
    application_url VARCHAR(1000) NULL,
    sale_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    list_id BIGINT NULL,
    is_example BOOLEAN NOT NULL DEFAULT TRUE,
    source_system VARCHAR(100) NULL,
    source_product_key VARCHAR(150) NULL,
    source_url VARCHAR(1000) NULL,
    as_of DATE NULL,
    collected_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    checked_at DATETIME NULL,
    created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (product_id),
    UNIQUE KEY uk_financial_products_code (product_code),
    UNIQUE KEY uk_financial_products_list_id (list_id),
    KEY idx_financial_products_institution_id (institution_id),
    CONSTRAINT fk_financial_products_institution
        FOREIGN KEY (institution_id) REFERENCES financial_institutions (institution_id),
    CONSTRAINT fk_financial_products_preparation_list
        FOREIGN KEY (list_id) REFERENCES preparation_lists (list_id),
    CONSTRAINT chk_product_type
        CHECK (product_type IN ('loan', 'account', 'insurance')),
    CONSTRAINT chk_product_sale_status
        CHECK (sale_status IN ('active', 'inactive', 'unknown'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_purposes (
    product_id BIGINT NOT NULL,
    purpose_code VARCHAR(50) NOT NULL,
    PRIMARY KEY (product_id, purpose_code),
    CONSTRAINT fk_product_purposes_product
        FOREIGN KEY (product_id) REFERENCES financial_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_tags (
    product_id BIGINT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (product_id, tag),
    CONSTRAINT fk_product_tags_product
        FOREIGN KEY (product_id) REFERENCES financial_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE loan_products (
    product_id BIGINT NOT NULL,
    loan_type VARCHAR(50) NULL,
    PRIMARY KEY (product_id),
    CONSTRAINT fk_loan_products_product
        FOREIGN KEY (product_id) REFERENCES financial_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE loan_options (
    loan_option_id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    option_name VARCHAR(150) NOT NULL,
    repayment_type VARCHAR(50) NULL,
    min_amount BIGINT NULL,
    max_amount BIGINT NULL,
    amount_condition_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    min_period INT NULL,
    max_period INT NULL,
    term_condition_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    min_grace_months INT NULL,
    max_grace_months INT NULL,
    grace_condition_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    requires_manual_check BOOLEAN NOT NULL DEFAULT TRUE,
    condition_description TEXT NULL,
    source_url VARCHAR(1000) NULL,
    as_of DATE NULL,
    checked_at DATETIME NULL,
    PRIMARY KEY (loan_option_id),
    KEY idx_loan_options_product_id (product_id),
    CONSTRAINT fk_loan_options_product
        FOREIGN KEY (product_id) REFERENCES loan_products (product_id),
    CONSTRAINT chk_option_min_amount CHECK (min_amount IS NULL OR min_amount >= 0),
    CONSTRAINT chk_option_max_amount CHECK (max_amount IS NULL OR max_amount >= 0),
    CONSTRAINT chk_option_amount_range CHECK (min_amount IS NULL OR max_amount IS NULL OR min_amount <= max_amount),
    CONSTRAINT chk_option_min_period CHECK (min_period IS NULL OR min_period >= 1),
    CONSTRAINT chk_option_max_period CHECK (max_period IS NULL OR max_period >= 1),
    CONSTRAINT chk_option_period_range CHECK (min_period IS NULL OR max_period IS NULL OR min_period <= max_period),
    CONSTRAINT chk_option_min_grace CHECK (min_grace_months IS NULL OR min_grace_months >= 0),
    CONSTRAINT chk_option_max_grace CHECK (max_grace_months IS NULL OR max_grace_months >= 0),
    CONSTRAINT chk_option_grace_range CHECK (min_grace_months IS NULL OR max_grace_months IS NULL OR min_grace_months <= max_grace_months),
    CONSTRAINT chk_option_condition_status_1 CHECK (amount_condition_status IN ('published', 'unrestricted', 'unknown')),
    CONSTRAINT chk_option_condition_status_2 CHECK (term_condition_status IN ('published', 'unrestricted', 'unknown')),
    CONSTRAINT chk_option_condition_status_3 CHECK (grace_condition_status IN ('published', 'unrestricted', 'unknown'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE loan_allowed_terms (
    loan_option_id BIGINT NOT NULL,
    term_months INT NOT NULL,
    PRIMARY KEY (loan_option_id, term_months),
    CONSTRAINT fk_loan_allowed_terms_option
        FOREIGN KEY (loan_option_id) REFERENCES loan_options (loan_option_id),
    CONSTRAINT chk_allowed_term CHECK (term_months >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE loan_interest_rates (
    rate_id BIGINT NOT NULL AUTO_INCREMENT,
    loan_option_id BIGINT NOT NULL,
    min_rate DECIMAL(9, 6) NULL,
    max_rate DECIMAL(9, 6) NULL,
    average_rate DECIMAL(9, 6) NULL,
    base_rate DECIMAL(9, 6) NULL,
    preferential_rate DECIMAL(9, 6) NULL,
    rate_type VARCHAR(30) NULL,
    rate_condition_status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    effective_date DATE NULL,
    end_date DATE NULL,
    source_url VARCHAR(1000) NULL,
    as_of DATE NULL,
    collected_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    checked_at DATETIME NULL,
    PRIMARY KEY (rate_id),
    KEY idx_loan_interest_rates_option_id (loan_option_id),
    CONSTRAINT fk_loan_interest_rates_option
        FOREIGN KEY (loan_option_id) REFERENCES loan_options (loan_option_id),
    CONSTRAINT chk_rate_range CHECK (min_rate IS NULL OR max_rate IS NULL OR min_rate <= max_rate),
    CONSTRAINT chk_rate_date_range CHECK (effective_date IS NULL OR end_date IS NULL OR effective_date <= end_date),
    CONSTRAINT chk_rate_condition_status CHECK (rate_condition_status IN ('published', 'unrestricted', 'unknown'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE account_products (
    product_id BIGINT NOT NULL,
    account_type VARCHAR(50) NULL,
    opening_methods TEXT NULL,
    benefit_description TEXT NULL,
    convenience_description TEXT NULL,
    PRIMARY KEY (product_id),
    CONSTRAINT fk_account_products_product
        FOREIGN KEY (product_id) REFERENCES financial_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE account_fee_rules (
    fee_id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    fee_type VARCHAR(80) NOT NULL,
    channel VARCHAR(80) NULL,
    fee_amount DECIMAL(20, 4) NULL,
    fee_rate DECIMAL(9, 6) NULL,
    currency VARCHAR(3) NULL,
    calculation_method VARCHAR(30) NULL,
    conditions TEXT NULL,
    benefit_conditions TEXT NULL,
    description TEXT NULL,
    source_url VARCHAR(1000) NULL,
    checked_at DATETIME NULL,
    PRIMARY KEY (fee_id),
    KEY idx_account_fee_rules_product_id (product_id),
    CONSTRAINT fk_account_fee_rules_product
        FOREIGN KEY (product_id) REFERENCES account_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE insurance_products (
    product_id BIGINT NOT NULL,
    insurance_type VARCHAR(50) NULL,
    premium BIGINT NULL,
    payment_type VARCHAR(30) NULL,
    premium_conditions TEXT NULL,
    PRIMARY KEY (product_id),
    CONSTRAINT fk_insurance_products_product
        FOREIGN KEY (product_id) REFERENCES financial_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE insurance_coverages (
    coverage_id BIGINT NOT NULL AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    coverage_code VARCHAR(50) NULL,
    coverage_name VARCHAR(150) NOT NULL,
    coverage_amount BIGINT NULL,
    description TEXT NULL,
    exclusion_description TEXT NULL,
    deductible_description TEXT NULL,
    source_url VARCHAR(1000) NULL,
    checked_at DATETIME NULL,
    PRIMARY KEY (coverage_id),
    KEY idx_insurance_coverages_product_id (product_id),
    CONSTRAINT fk_insurance_coverages_product
        FOREIGN KEY (product_id) REFERENCES insurance_products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
