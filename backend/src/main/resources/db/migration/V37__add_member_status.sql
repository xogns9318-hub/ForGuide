-- 관리자 회원 관리용 상태. 기존 회원은 정상 상태로 유지한다.
-- MySQL 운영 DB와 H2 테스트 DB에서 모두 적용되도록 위치 지정 문법은 사용하지 않는다.
ALTER TABLE members
    ADD COLUMN member_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE members
    ADD COLUMN suspended_at TIMESTAMP NULL;

CREATE INDEX idx_members_status_created
    ON members (member_status, created_at, member_id);

ALTER TABLE members
    ADD CONSTRAINT chk_members_member_status
        CHECK (member_status IN ('ACTIVE', 'SUSPENDED'));
