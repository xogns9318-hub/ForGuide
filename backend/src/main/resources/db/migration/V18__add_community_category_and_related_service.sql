-- 작성자가 직접 고르는 글 성격과, 후기 글의 내부 서비스 연결 정보입니다.
-- 기존 글은 자유 이야기로 보이도록 기본값을 둡니다.
ALTER TABLE community_posts
    ADD COLUMN category VARCHAR(30) NOT NULL DEFAULT 'FREE_TALK' AFTER topic,
    ADD COLUMN related_service VARCHAR(30) NULL AFTER category,
    ADD KEY idx_community_posts_category_created_at (category, created_at, post_id);
