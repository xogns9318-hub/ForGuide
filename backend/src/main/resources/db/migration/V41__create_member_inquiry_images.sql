-- 문의 첨부 이미지는 문의 본문과 분리해 여러 장을 안전하게 관리한다.
CREATE TABLE member_inquiry_images (
    inquiry_image_id BIGINT NOT NULL AUTO_INCREMENT,
    inquiry_id BIGINT NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    display_order INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (inquiry_image_id),

    UNIQUE KEY uk_member_inquiry_images_order (
        inquiry_id,
        display_order
    ),
    KEY idx_member_inquiry_images_inquiry (inquiry_id),

    CONSTRAINT fk_member_inquiry_images_inquiry
        FOREIGN KEY (inquiry_id)
        REFERENCES member_inquiries (inquiry_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
