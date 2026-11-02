-- 내 금융 정보(/my-finance): 신용점수 구간·주거래은행 칸을 더하고, 비어 있던 고용 형태 선택지를 넣는다.
-- 모르는 값은 NULL로 둔다 (0과 구분, 화면에는 "확인 필요").

-- 신용점수 구간: 상세 추천과 같은 공시 8구간 (900점 초과 ~ 300점 이하). 값은 구간 코드
--   GT900(900점 초과) / 801_900 / 701_800 / 601_700 / 501_600 / 401_500 / 301_400 / LE300(300점 이하)
-- 주거래은행: 추천 데이터(금융상품한눈에 공시)의 은행 이름, 또는 OTHER(기타) / NONE(없음)
ALTER TABLE customer_finances
    ADD COLUMN credit_score_band VARCHAR(10) NULL AFTER employment_type_id,
    ADD COLUMN main_bank VARCHAR(50) NULL AFTER credit_score_band;

ALTER TABLE customer_finances ADD CONSTRAINT chk_finance_credit_score_band CHECK (
    credit_score_band IS NULL
    OR credit_score_band IN ('GT900', '801_900', '701_800', '601_700', '501_600', '401_500', '301_400', 'LE300'));

-- 고용 형태 선택지 (화면 표시 이름은 프론트 번역 문구가 코드로 정한다)
INSERT INTO employment_types (employment_code, employment_name) VALUES
    ('REGULAR', '정규직'),
    ('CONTRACT', '계약직'),
    ('DAILY', '일용직'),
    ('SELF_EMPLOYED', '자영업'),
    ('FREELANCER', '프리랜서'),
    ('STUDENT', '학생'),
    ('UNEMPLOYED', '무직'),
    ('OTHER', '기타');
