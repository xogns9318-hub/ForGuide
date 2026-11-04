-- 신고 증빙 이미지는 공개 게시글 이미지와 분리해 신고자·관리자만 접근할 수 있게 보관한다.
CREATE TABLE community_report_images (
    report_image_id BIGINT NOT NULL AUTO_INCREMENT,
    report_id BIGINT NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    display_order INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (report_image_id),
    UNIQUE KEY uk_community_report_images_order (report_id, display_order),
    KEY idx_community_report_images_report (report_id),

    CONSTRAINT fk_community_report_images_report
        FOREIGN KEY (report_id)
        REFERENCES community_reports (report_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
