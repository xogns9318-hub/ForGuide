-- 로그인한 회원의 문의와 관리자 답변을 함께 저장한다.
CREATE TABLE member_inquiries (
    inquiry_id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,

    -- SERVICE: 서비스 이용, ACCOUNT: 계정·로그인,
    -- FINANCE: 금융 정보, OTHER: 기타
    inquiry_category VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,

    -- RECEIVED: 접수됨, ANSWERED: 답변 완료
    inquiry_status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    answer_content TEXT NULL,
    answered_by_member_id BIGINT NULL,
    answered_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (inquiry_id),

    -- 회원의 내 문의 목록과 관리자 상태별 목록 조회에 사용한다.
    KEY idx_member_inquiries_member_created (
        member_id,
        created_at,
        inquiry_id
    ),
    KEY idx_member_inquiries_status_created (
        inquiry_status,
        created_at,
        inquiry_id
    ),

    CONSTRAINT fk_member_inquiries_member
        FOREIGN KEY (member_id)
        REFERENCES members (member_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_member_inquiries_answered_by
        FOREIGN KEY (answered_by_member_id)
        REFERENCES members (member_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_member_inquiries_category
        CHECK (
            inquiry_category IN (
                'SERVICE',
                'ACCOUNT',
                'FINANCE',
                'OTHER'
            )
        ),

    CONSTRAINT chk_member_inquiries_status
        CHECK (
            inquiry_status IN (
                'RECEIVED',
                'ANSWERED'
            )
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
