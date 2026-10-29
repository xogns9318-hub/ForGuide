-- V28의 게시글 전용 번역 테이블을 게시글·댓글 공용 테이블로 확장한다.
-- 이미 적용된 V28은 수정하지 않고, 새 마이그레이션으로 구조를 변경한다.

RENAME TABLE community_post_translations
    TO community_content_translations;

ALTER TABLE community_content_translations
    -- 게시글 FK는 게시글·댓글 공통 테이블에서는 유지할 수 없으므로 제거한다.
    DROP FOREIGN KEY fk_community_post_translations_post,

    -- 테이블과 컬럼 이름을 공개 콘텐츠 공통 의미로 변경한다.
    CHANGE COLUMN post_translation_id
        content_translation_id BIGINT NOT NULL AUTO_INCREMENT,

    CHANGE COLUMN post_id
        resource_id BIGINT NOT NULL,

    -- community-post 또는 community-comment를 구분한다.
    ADD COLUMN resource_type VARCHAR(30) NOT NULL
        DEFAULT 'community-post'
        AFTER content_translation_id,

    -- 기존 게시글 전용 UNIQUE KEY를 제거한다.
    DROP INDEX uk_community_post_translation_version_language,

    -- 게시글·댓글 모두에 적용되는 공통 UNIQUE KEY를 만든다.
    ADD UNIQUE KEY uk_community_content_translation_version_language
        (resource_type, resource_id, content_version, target_language),

    ADD CONSTRAINT chk_community_content_translation_resource_type
        CHECK (resource_type IN ('community-post', 'community-comment'));
