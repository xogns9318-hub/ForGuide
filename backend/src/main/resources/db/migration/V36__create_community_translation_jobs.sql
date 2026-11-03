-- 같은 공개 콘텐츠·버전·언어의 동시 번역 요청을 한 건으로 묶는다.
-- 작업을 완료하거나 실패하면 행을 지우고, 서버가 비정상 종료되면 locked_until 이후 다른 요청이 다시 시도할 수 있다.
CREATE TABLE community_translation_jobs (
    resource_type   VARCHAR(30) NOT NULL,
    resource_id     BIGINT      NOT NULL,
    content_version INT         NOT NULL,
    target_language VARCHAR(10) NOT NULL,
    lock_token      CHAR(36)    NOT NULL,
    locked_until    DATETIME    NOT NULL,
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (
        resource_type,
        resource_id,
        content_version,
        target_language
    ),

    CONSTRAINT chk_community_translation_jobs_resource_type
        CHECK (resource_type IN ('community-post', 'community-comment')),

    CONSTRAINT chk_community_translation_jobs_target_language
        CHECK (target_language IN ('ko', 'en', 'ja', 'zh', 'vi', 'th'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
