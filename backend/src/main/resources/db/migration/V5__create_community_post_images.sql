-- 게시글에 연결되는 사진 목록입니다. 사진은 게시글당 최대 4장(표시 순서 0~3)입니다.

CREATE TABLE community_post_images (
    image_id BIGINT NOT NULL AUTO_INCREMENT,
    post_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order TINYINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (image_id),
    UNIQUE KEY uk_community_post_images_post_order (post_id, display_order),
    CONSTRAINT fk_community_post_images_post
        FOREIGN KEY (post_id) REFERENCES community_posts (post_id) ON DELETE CASCADE,
    CONSTRAINT chk_community_post_images_order
        CHECK (display_order BETWEEN 0 AND 3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
