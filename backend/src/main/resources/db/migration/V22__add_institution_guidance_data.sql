-- 전화·방문의 조건부 설명과 준비물 등을 제공받은 원문 그대로 보관한다.
-- 상담 검색에 사용하는 기존 업무·언어·지역 테이블은 유지한다.
ALTER TABLE support_institutions
    ADD COLUMN guidance_data JSON NULL
        COMMENT '기관 안내 조사 원문: name, card, detail, sources';