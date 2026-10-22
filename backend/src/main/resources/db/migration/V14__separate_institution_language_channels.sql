-- 지원 언어가 어느 상담 방식에 해당하는지 기록한다.
-- 기존 데이터의 상담 방식을 임의로 전화나 방문으로 단정하지 않는다.
ALTER TABLE institution_service_languages
    ADD COLUMN consultation_method VARCHAR(10) NOT NULL DEFAULT 'unknown'
        COMMENT 'phone 전화, visit 방문, online 온라인, unknown 방식 미확인',

    -- 같은 서비스·언어를 전화와 방문에 각각 연결할 수 있게 한다.
    -- 기존 행은 삭제하지 않고 unknown 방식으로 유지한다.
    -- service_id를 첫 컬럼으로 유지해 기존 서비스 외래키를 지원한다.
    DROP PRIMARY KEY,
    ADD PRIMARY KEY (
        service_id,
        language_code,
        consultation_method
    ),

    ADD CONSTRAINT chk_institution_service_languages_method CHECK (
        consultation_method IN ('phone', 'visit', 'online', 'unknown')
    );