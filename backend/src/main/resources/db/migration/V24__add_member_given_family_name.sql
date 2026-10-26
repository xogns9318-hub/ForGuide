-- 회원 이름을 이름(given name)과 성(family name)으로 나눠 저장합니다.
-- - given_name: 이름 (필수 입력, 최대 50자)
-- - family_name: 성 (선택 입력, 최대 50자. 성이 없는 문화권 사용자를 위해 비워 둘 수 있음)
-- - name: 화면 표시용 "이름 성" (두 칸을 합칠 수 있게 101자로 늘림)
-- 버전 번호: 다른 브랜치가 V22·V23을 쓰고 있어 V24로 둡니다. 공용 DB에는 V22·V23 다음에 적용해야 합니다.

ALTER TABLE members ADD COLUMN given_name VARCHAR(50) NULL AFTER name;

ALTER TABLE members ADD COLUMN family_name VARCHAR(50) NULL AFTER given_name;

ALTER TABLE members MODIFY COLUMN name VARCHAR(101) NOT NULL;

-- 기존 회원: 하나로 받았던 이름을 이름 칸으로 옮긴다 (성은 알 수 없으므로 비워 둔다)
UPDATE members SET given_name = name WHERE given_name IS NULL;
