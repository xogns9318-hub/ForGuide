-- 전화 상담의 이용 지역과 실제 방문 지역을 구분한다.
-- 기존 지역 연결의 상담 방식을 추측하지 않고 unknown으로 유지한다.
ALTER TABLE institution_service_regions
    ADD COLUMN consultation_method VARCHAR(10) NOT NULL DEFAULT 'unknown'
        COMMENT 'phone 전화, visit 방문, online 온라인, unknown 방식 미확인',

    -- 같은 서비스·지역을 전화와 방문에 각각 연결할 수 있게 한다.
    -- 기존 service_id·region_id 외래키와 행 자체는 유지한다.
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (
        service_id,
        region_id,
        consultation_method
    ),

    ADD CONSTRAINT chk_institution_service_regions_method CHECK (
        consultation_method IN ('phone', 'visit', 'online', 'unknown')
    );