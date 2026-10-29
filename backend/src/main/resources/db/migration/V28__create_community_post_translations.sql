-- 공개 게시글의 언어별 번역문을 원문 버전과 함께 저장한다.
CREATE TABLE community_post_translations (
    post_translation_id BIGINT          NOT NULL AUTO_INCREMENT,
    post_id             BIGINT          NOT NULL,

    -- 게시글 수정하면 content_version이 증가
    -- 이전 원문으로 만든 번역문을 재사용하지 않기 위한 값이다.
    content_version     INT             NOT NULL,
    source_language     VARCHAR(10)     NOT NULL,
    target_language     VARCHAR(10)     NOT NULL,

    -- Gemini가 생성한 번역문이다. 원문은 community_posts.content에 그대로 보관
    translated_content  TEXT            NOT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                         ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (post_translation_id),

    -- 같은 게시글의 같은 원문 버전,대상 언어에는 번역문을 하나만 저장한다.
    UNIQUE KEY uk_community_post_translation_version_language
        (post_id, content_version, target_language),

    CONSTRAINT fk_community_post_translations_post
        FOREIGN KEY (post_id)
        REFERENCES community_posts (post_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_community_post_translation_target_language
        CHECK (target_language IN  ('ko', 'en', 'ja', 'zh', 'vi', 'th'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;