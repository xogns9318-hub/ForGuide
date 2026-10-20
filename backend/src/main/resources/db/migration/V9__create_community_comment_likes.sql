-- 댓글별 공감 기록: 같은 회원이 같은 댓글을 여러 번 공감하지 못하게 한다.
CREATE TABLE community_comment_likes (
    comment_like_id BIGINT NOT NULL AUTO_INCREMENT,
    comment_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_like_id),
    UNIQUE KEY uk_comment_likes_comment_member (comment_id, member_id),
    KEY idx_comment_likes_member_id (member_id),
    CONSTRAINT fk_comment_likes_comment
        FOREIGN KEY (comment_id) REFERENCES community_comments (comment_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_comment_likes_member
        FOREIGN KEY (member_id) REFERENCES members (member_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
