-- 게시글 조회수 중복 방지를 위한 조회 기록 테이블
CREATE TABLE community_post_view_records(
    view_record_id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    member_id BIGINT NULL,
    visitor_token VARCHAR(64) NULL,
    viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (view_record_id),

    -- 로그인 회원과 비회원 각각의 24시간 중복 조회 확인에 사용
    KEY idx_post_view_member (post_id, member_id, viewed_at),
    KEY idx_post_view_visitor (post_id, visitor_token, viewed_at),

    CONSTRAINT fk_post_view_records_post
        FOREIGN KEY (post_id) REFERENCES community_posts (post_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_post_view_records_member
        FOREIGN KEY (member_id) REFERENCES members (member_id),

    -- 로그인 회원 또는 비회원 쿠키 토큰 중 정확히 하나만 저장
    CONSTRAINT chk_post_view_records_viewer
        CHECK (
            (member_id IS NOT NULL AND visitor_token IS NULL)
            OR
            (member_id IS NULL AND visitor_token IS NOT NULL )
            )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;