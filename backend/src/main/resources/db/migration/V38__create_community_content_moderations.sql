-- 게시글과 댓글의 공개 상태를 하나의 관리 기록으로 보관한다.
-- 원문 콘텐츠는 삭제하지 않아 관리자 화면에서 숨김을 취소하고 복구할 수 있다.
CREATE TABLE community_content_moderations (
    moderation_id BIGINT NOT NULL AUTO_INCREMENT,

    -- POST: 게시글, COMMENT: 댓글
    resource_type VARCHAR(20) NOT NULL,
    resource_id BIGINT NOT NULL,

    -- VISIBLE: 공개, HIDDEN: 관리자 숨김
    moderation_status VARCHAR(20) NOT NULL DEFAULT 'VISIBLE',
    reason VARCHAR(500) NULL,
    moderated_by_member_id BIGINT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (moderation_id),

    -- 같은 게시글 또는 댓글은 현재 관리 상태를 하나만 유지한다.
    UNIQUE KEY uk_community_content_moderations_resource (
        resource_type,
        resource_id
    ),

    -- 관리자 화면의 상태별 목록 조회와 콘텐츠 조회 시 숨김 여부 확인에 사용한다.
    KEY idx_community_content_moderations_status_updated (
        moderation_status,
        updated_at,
        moderation_id
    ),

    CONSTRAINT fk_community_content_moderations_moderator
        FOREIGN KEY (moderated_by_member_id)
        REFERENCES members (member_id)
        ON DELETE SET NULL,

    CONSTRAINT chk_community_content_moderations_resource_type
        CHECK (resource_type IN ('POST', 'COMMENT')),
    CONSTRAINT chk_community_content_moderations_status
        CHECK (moderation_status IN ('VISIBLE', 'HIDDEN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
