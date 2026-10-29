-- 회원이 오프라인이어도 나중에 확인할 수 있도록 알림을 영구 저장한다.
-- 실제 표시 문구는 프런트엔드 i18next가 notification_type과 관련 정보를 조합해 만든다.
CREATE TABLE member_notifications (
    notification_id BIGINT NOT NULL AUTO_INCREMENT,
    recipient_member_id BIGINT NOT NULL,
    actor_member_id BIGINT NULL,
    notification_type VARCHAR(40) NOT NULL,
    resource_type VARCHAR(40) NOT NULL,
    resource_id BIGINT NOT NULL,
    rank_position INT NULL,
    notification_event_key VARCHAR(191) NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (notification_id),
    UNIQUE KEY uk_member_notifications_event_key (notification_event_key),
    KEY idx_member_notifications_recipient_created (
        recipient_member_id,
        created_at,
        notification_id
    ),
    KEY idx_member_notifications_recipient_read (
        recipient_member_id,
        read_at
    ),
    KEY idx_member_notifications_actor (actor_member_id),

    CONSTRAINT fk_member_notifications_recipient
        FOREIGN KEY (recipient_member_id)
        REFERENCES members (member_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_member_notifications_actor
        FOREIGN KEY (actor_member_id)
        REFERENCES members (member_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_member_notifications_rank
        CHECK (rank_position IS NULL OR rank_position >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
