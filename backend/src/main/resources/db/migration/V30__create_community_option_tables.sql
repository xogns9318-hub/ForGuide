-- 커뮤니티에서 선택·검증하는 카테고리 목록
CREATE TABLE community_categories (
    category_code VARCHAR(30) NOT NULL,
    label_key VARCHAR(100) NOT NULL,
    display_order INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (category_code),
    KEY idx_community_categories_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 후기·추천 게시글에서 선택 가능한 관련 서비스
CREATE TABLE community_related_services (
    service_code VARCHAR(30) NOT NULL,
    category_code VARCHAR(30) NOT NULL,
    label_key VARCHAR(100) NOT NULL,
    display_order INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (service_code),
    KEY idx_community_related_services_category_order (
        category_code,
        is_active,
        display_order
    ),
    CONSTRAINT fk_community_related_services_category
        FOREIGN KEY (category_code)
        REFERENCES community_categories (category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 사이드바 필터에 사용하는 주요 주제
CREATE TABLE community_topics (
    topic_code VARCHAR(30) NOT NULL,
    label_key VARCHAR(100) NOT NULL,
    display_order INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (topic_code),
    KEY idx_community_topics_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 주제 필터가 게시글 본문 검색에 사용할 키워드
CREATE TABLE community_topic_keywords (
    topic_code VARCHAR(30) NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    PRIMARY KEY (topic_code, keyword),
    CONSTRAINT fk_community_topic_keywords_topic
        FOREIGN KEY (topic_code)
        REFERENCES community_topics (topic_code)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO community_categories (
    category_code,
    label_key,
    display_order
) VALUES
    ('QUESTION_ANSWER', 'community.navigation.questionAnswer', 1),
    ('REVIEW_RECOMMEND', 'community.navigation.reviewRecommend', 2),
    ('FREE_TALK', 'community.navigation.freeTalk', 3);

INSERT INTO community_related_services (
    service_code,
    category_code,
    label_key,
    display_order
) VALUES
    ('ACCOUNT_RECOMMEND', 'REVIEW_RECOMMEND', 'community.relatedServices.account', 1),
    ('LOAN_RECOMMEND', 'REVIEW_RECOMMEND', 'community.relatedServices.loan', 2),
    ('INSURANCE_RECOMMEND', 'REVIEW_RECOMMEND', 'community.relatedServices.insurance', 3),
    ('EMPLOYMENT_GUIDE', 'REVIEW_RECOMMEND', 'community.relatedServices.employment', 4);

INSERT INTO community_topics (
    topic_code,
    label_key,
    display_order
) VALUES
    ('ACCOUNT', 'community.topics.account', 1),
    ('LOAN', 'community.topics.loan', 2),
    ('INSURANCE', 'community.topics.insurance', 3),
    ('VISA_STAY', 'community.topics.visaStay', 4),
    ('LIFE_TIP', 'community.topics.lifeTip', 5);

INSERT INTO community_topic_keywords (
    topic_code,
    keyword
) VALUES
    ('ACCOUNT', '계좌'),
    ('ACCOUNT', '은행'),
    ('ACCOUNT', '통장'),
    ('ACCOUNT', '개설'),
    ('LOAN', '대출'),
    ('LOAN', '금리'),
    ('LOAN', '상환'),
    ('LOAN', '보증'),
    ('INSURANCE', '보험'),
    ('INSURANCE', '보장'),
    ('INSURANCE', '보험료'),
    ('INSURANCE', '가입'),
    ('VISA_STAY', '비자'),
    ('VISA_STAY', '체류'),
    ('VISA_STAY', '외국인등록'),
    ('VISA_STAY', '연장'),
    ('LIFE_TIP', '교통'),
    ('LIFE_TIP', '병원'),
    ('LIFE_TIP', '휴대폰'),
    ('LIFE_TIP', '주거'),
    ('LIFE_TIP', '쓰레기');
