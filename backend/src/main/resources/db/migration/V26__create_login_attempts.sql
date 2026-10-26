-- 로그인 실패 횟수와 잠금 시각을 아이디별로 저장합니다 (5번 실패하면 15분 잠금).
-- 가입되지 않은 아이디도 같은 방식으로 기록합니다: 잠금 여부로 "가입된 아이디인지"가 드러나지 않게 하기 위해서입니다.
-- 로그인에 성공하거나 잠금·실패 기록이 지나면 행을 지웁니다.
CREATE TABLE login_attempts (
    login_id        VARCHAR(20) NOT NULL,
    failed_count    INT         NOT NULL,
    last_failed_at  DATETIME    NOT NULL,
    locked_until    DATETIME    NULL,
    PRIMARY KEY (login_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
