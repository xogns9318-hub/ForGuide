-- 이메일 인증 용도에 아이디 찾기(FIND_ID)를 더한다.
-- 용도마다 인증 토큰이 따로라, 아이디 찾기로 받은 토큰으로는 비밀번호를 바꿀 수 없다.
ALTER TABLE email_verifications DROP CHECK chk_email_verifications_purpose;

ALTER TABLE email_verifications
    ADD CONSTRAINT chk_email_verifications_purpose CHECK (purpose IN ('SIGNUP', 'PASSWORD_RESET', 'FIND_ID'));
