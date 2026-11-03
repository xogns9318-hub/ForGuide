-- 추천 실행 현황을 개인정보 없이 집계하기 위한 운영 로그다.
-- 사용자가 입력한 조건값과 회원 식별값은 저장하지 않는다.
CREATE TABLE recommendation_usage_logs (
    usage_id BIGINT NOT NULL AUTO_INCREMENT,

    -- LOAN: 대출, INSURANCE: 보험, ACCOUNT: 계좌 추천
    recommendation_type VARCHAR(20) NOT NULL,

    -- PRODUCT_RESULT: 상품 결과 제공, CONSULTATION_REDIRECT: 상담 안내로 이동
    outcome_type VARCHAR(30) NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (usage_id),

    -- 관리자 화면의 추천 종류별·기간별 집계에 사용한다.
    KEY idx_recommendation_usage_logs_type_created (
        recommendation_type,
        created_at
    ),
    KEY idx_recommendation_usage_logs_created (created_at),

    CONSTRAINT chk_recommendation_usage_logs_type
        CHECK (recommendation_type IN ('LOAN', 'INSURANCE', 'ACCOUNT')),
    CONSTRAINT chk_recommendation_usage_logs_outcome
        CHECK (outcome_type IN ('PRODUCT_RESULT', 'CONSULTATION_REDIRECT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
