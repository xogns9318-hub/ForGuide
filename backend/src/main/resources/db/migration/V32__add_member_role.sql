-- 회원 역할: 일반 회원(USER) / 관리자(ADMIN). 기존 회원은 모두 일반 회원이 된다.
-- 관리자 계정은 서버 시작 때 환경변수(FORGUIDE_ADMIN_*)로 만든다 (member/service/AdminAccountInitializer).
-- /api/v1/admin/** 는 ADMIN만 접근할 수 있다 (common/security/SecurityConfig).
ALTER TABLE members ADD COLUMN role VARCHAR(10) NOT NULL DEFAULT 'USER' AFTER password;

ALTER TABLE members ADD CONSTRAINT chk_members_role CHECK (role IN ('USER', 'ADMIN'));
