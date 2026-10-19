ALTER TABLE community_comments
    ADD COLUMN parent_comment_id BIGINT NULL AFTER post_id,
    ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER content_version,
    ADD KEY idx_community_comments_parent_comment_id (parent_comment_id),
    ADD CONSTRAINT fk_community_comments_parent
        FOREIGN KEY (parent_comment_id)
        REFERENCES community_comments (comment_id)
        ON DELETE SET NULL;
