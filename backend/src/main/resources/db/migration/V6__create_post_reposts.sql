-- 회원이 원본 게시글을 자신의 피드에 리포스트한 기록입니다.
-- 같은 회원이 같은 게시글을 여러 번 리포스트하지 못하게 합니다.

CREATE TABLE post_reposts (
    repost_id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (repost_id),
    UNIQUE KEY uk_post_reposts_post_member (post_id, member_id),
    KEY idx_post_reposts_member_id (member_id),
    CONSTRAINT fk_post_reposts_post
        FOREIGN KEY (post_id) REFERENCES community_posts (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_post_reposts_member
        FOREIGN KEY (member_id) REFERENCES members (member_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
