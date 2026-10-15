-- 제목 없는 본문 중심 커뮤니티와 댓글·좋아요 테이블입니다.

CREATE TABLE community_posts (
    post_id BIGINT NOT NULL AUTO_INCREMENT,
    member_id BIGINT NOT NULL,
    topic VARCHAR(30) NULL,
    content TEXT NOT NULL,
    language VARCHAR(35) NULL,
    content_version INT NOT NULL DEFAULT 1,
    created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (post_id),
    KEY idx_community_posts_member_id (member_id),
    KEY idx_community_posts_cursor (created_at, post_id),
    CONSTRAINT fk_community_posts_member
        FOREIGN KEY (member_id) REFERENCES members (member_id),
    CONSTRAINT chk_post_version CHECK (content_version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE community_comments (
    comment_id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(35) NULL,
    content_version INT NOT NULL DEFAULT 1,
    created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    PRIMARY KEY (comment_id),
    KEY idx_community_comments_post_id (post_id),
    KEY idx_community_comments_member_id (member_id),
    CONSTRAINT fk_community_comments_post
        FOREIGN KEY (post_id) REFERENCES community_posts (post_id),
    CONSTRAINT fk_community_comments_member
        FOREIGN KEY (member_id) REFERENCES members (member_id),
    CONSTRAINT chk_comment_version CHECK (content_version >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE post_likes (
    like_id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (like_id),
    UNIQUE KEY uk_post_likes_post_member (post_id, member_id),
    KEY idx_post_likes_member_id (member_id),
    CONSTRAINT fk_post_likes_post
        FOREIGN KEY (post_id) REFERENCES community_posts (post_id),
    CONSTRAINT fk_post_likes_member
        FOREIGN KEY (member_id) REFERENCES members (member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
