-- SecurityConfigTest가 JWT 필터의 DB 상태 확인에 쓰는 최소 회원 데이터
INSERT INTO members (
    member_id,
    login_id,
    password,
    role,
    member_status,
    name,
    email
)
VALUES
    (1, 'adminuser', 'test-password', 'ADMIN', 'ACTIVE', '관리자', 'admin@test.local'),
    (7, 'testuser7', 'test-password', 'USER', 'ACTIVE', '테스트 회원 7', 'user7@test.local'),
    (9, 'testuser9', 'test-password', 'USER', 'ACTIVE', '테스트 회원 9', 'user9@test.local');