-- 회원 기능 보강: 이름·성 분리, 이메일 인증, 로그인 시도 제한
-- 버전 번호: 다른 브랜치가 V22·V23을 쓰고 있어 V24로 둡니다. 공용 DB에는 V22·V23 다음에 적용해야 합니다.

-- 1. 회원 이름을 이름(given name)과 성(family name)으로 나눠 저장합니다.
-- - given_name: 이름 (필수 입력, 최대 50자)
-- - family_name: 성 (선택 입력, 최대 50자. 성이 없는 문화권 사용자를 위해 비워 둘 수 있음)
-- - name: 화면 표시용 "이름 성" (두 칸을 합칠 수 있게 101자로 늘림)
ALTER TABLE members ADD COLUMN given_name VARCHAR(50) NULL AFTER name;

ALTER TABLE members ADD COLUMN family_name VARCHAR(50) NULL AFTER given_name;

ALTER TABLE members MODIFY COLUMN name VARCHAR(101) NOT NULL;

-- 기존 회원: 하나로 받았던 이름을 이름 칸으로 옮긴다 (성은 알 수 없으므로 비워 둔다)
UPDATE members SET given_name = name WHERE given_name IS NULL;

-- 2. 이메일 인증 코드와 인증 완료 토큰 (회원가입·비밀번호 찾기 공통)
-- 보안: 코드와 토큰은 원문이 아니라 SHA-256 해시만 저장합니다.
CREATE TABLE email_verifications (
    verification_id   BIGINT       NOT NULL AUTO_INCREMENT,
    email             VARCHAR(255) NOT NULL,
    purpose           VARCHAR(20)  NOT NULL,
    code_hash         CHAR(64)     NOT NULL,
    expires_at        DATETIME     NOT NULL,
    failed_attempts   INT          NOT NULL DEFAULT 0,
    verified_at       DATETIME     NULL,
    token_hash        CHAR(64)     NULL,
    token_expires_at  DATETIME     NULL,
    token_used_at     DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (verification_id),
    UNIQUE KEY uk_email_verifications_token_hash (token_hash),
    KEY idx_email_verifications_email_purpose (email, purpose, created_at),
    CONSTRAINT chk_email_verifications_purpose CHECK (purpose IN ('SIGNUP', 'PASSWORD_RESET'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. 아이디별 로그인 실패 횟수와 잠금 시각 (5번 실패하면 15분 잠금)
-- 가입되지 않은 아이디도 같은 방식으로 기록합니다: 잠금 여부로 "가입된 아이디인지"가 드러나지 않게 하기 위해서입니다.
-- 로그인에 성공하거나 잠금·실패 기록이 지나면 행을 지웁니다.
CREATE TABLE login_attempts (
    login_id        VARCHAR(20) NOT NULL,
    failed_count    INT         NOT NULL,
    last_failed_at  DATETIME    NOT NULL,
    locked_until    DATETIME    NULL,
    PRIMARY KEY (login_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
