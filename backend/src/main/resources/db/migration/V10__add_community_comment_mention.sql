ALTER TABLE community_comments
    ADD COLUMN mentioned_member_id BIGINT NULL AFTER parent_comment_id,
    ADD KEY idx_community_comments_mentioned_member_id (mentioned_member_id),
    ADD CONSTRAINT fk_community_comments_mentioned_member
        FOREIGN KEY (mentioned_member_id)
        REFERENCES members (member_id)
        ON DELETE SET NULL;
