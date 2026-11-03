-- 게시글·댓글 신고를 하나의 공통 구조로 저장한다.
-- resource_type과 resource_id는 게시글·댓글을 함께 표현하므로 개별 외래키를 두지 않는다.
CREATE TABLE community_reports (
    report_id BIGINT NOT NULL AUTO_INCREMENT,
    reporter_member_id BIGINT NOT NULL,

    -- POST: 게시글, COMMENT: 댓글
    resource_type VARCHAR(20) NOT NULL,
    resource_id BIGINT NOT NULL,

    -- SPAM_AD: 스팸·광고, ABUSE_HATE: 욕설·혐오,
    -- SEXUAL_CONTENT: 음란물·성적 콘텐츠, MISINFORMATION: 허위·부적절 정보, OTHER: 기타
    report_reason VARCHAR(30) NOT NULL,

    -- PENDING: 접수됨, HIDDEN: 숨김 처리, DISMISSED: 반려
    report_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    handled_by_member_id BIGINT NULL,
    handled_at DATETIME NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (report_id),

    -- 한 회원은 같은 게시글 또는 댓글을 한 번만 신고할 수 있다.
    UNIQUE KEY uk_community_reports_reporter_resource (
        reporter_member_id,
        resource_type,
        resource_id
    ),

    -- 관리자 미처리 신고 목록과 콘텐츠별 일괄 처리에 사용한다.
    KEY idx_community_reports_status_created (
        report_status,
        created_at,
        report_id
    ),
    KEY idx_community_reports_resource_status (
        resource_type,
        resource_id,
        report_status
    ),

    CONSTRAINT fk_community_reports_reporter
        FOREIGN KEY (reporter_member_id)
        REFERENCES members (member_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_community_reports_handled_by
        FOREIGN KEY (handled_by_member_id)
        REFERENCES members (member_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_community_reports_resource_type
        CHECK (resource_type IN ('POST', 'COMMENT')),
    CONSTRAINT chk_community_reports_reason
        CHECK (report_reason IN (
            'SPAM_AD',
            'ABUSE_HATE',
            'SEXUAL_CONTENT',
            'MISINFORMATION',
            'OTHER'
        )),
    CONSTRAINT chk_community_reports_status
        CHECK (report_status IN ('PENDING', 'HIDDEN', 'DISMISSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
