-- 상담 업무의 역할과 방식별 운영 정보를 확장한다.
-- 기존 전화번호·전화시간·방문 가능 여부 등의 컬럼은 그대로 사용한다.
ALTER TABLE institution_services
    -- 출입국·행정 안내를 금융 분야에 억지로 넣지 않는다.
    -- 기존 17개 분야 코드는 유지하고, 해당 분야가 없을 때 NULL을 사용한다.
    -- 기존 chk_service_topic 제약은 삭제하지 않는다.
    MODIFY COLUMN topic_code VARCHAR(50) NULL
        COMMENT '상담 분야 코드, 비금융 행정 안내는 NULL',

    -- 같은 기관 안에서 상담 업무를 안정적으로 식별한다.
    ADD COLUMN service_code VARCHAR(80) NULL
        COMMENT '기관 안에서 사용하는 상담 업무 고정 코드',

    -- 기존 업무를 임의로 직접 상담이라고 분류하지 않는다.
    ADD COLUMN guidance_role VARCHAR(20) NOT NULL DEFAULT 'unknown'
        COMMENT 'direct 직접 상담, related 관련 민원·기관 안내, unknown 미확인',

    -- 예약 가능 여부는 기존 reservation_available을 사용한다.
    -- 아래 컬럼은 방문 전에 예약이 반드시 필요한지를 저장한다.
    ADD COLUMN visit_reservation_required BOOLEAN NULL
        COMMENT '방문 예약 필수 여부, NULL 미확인',

    -- 전화와 방문의 운영 여부를 따로 기록한다.
    -- 1은 확인된 운영, 0은 확인된 미운영, NULL은 미확인이다.
    ADD COLUMN phone_weekend_available BOOLEAN NULL
        COMMENT '주말 일반 전화 운영',
    ADD COLUMN phone_holiday_available BOOLEAN NULL
        COMMENT '공휴일 일반 전화 운영',
    ADD COLUMN visit_weekend_available BOOLEAN NULL
        COMMENT '주말 방문 운영',
    ADD COLUMN visit_holiday_available BOOLEAN NULL
        COMMENT '공휴일 방문 운영',

    -- 일부 긴급 업무만 별도 시간에 운영하는 경우를 저장한다.
    -- 별도 운영시간을 일반 상담 전체에 적용하지 않는다.
    ADD COLUMN special_phone_hours TEXT NULL
        COMMENT '특정 업무의 별도 전화시간',
    ADD COLUMN special_phone_scope TEXT NULL
        COMMENT '별도 전화시간이 적용되는 업무',
    ADD COLUMN special_phone_weekend_available BOOLEAN NULL
        COMMENT '별도 전화의 주말 운영',
    ADD COLUMN special_phone_holiday_available BOOLEAN NULL
        COMMENT '별도 전화의 공휴일 운영',

    -- 예: 저녁 시간에는 일부 언어만 지원한다는 안내를 보관한다.
    ADD COLUMN language_notes TEXT NULL
        COMMENT '지원 언어의 시간대·이용 조건',

    -- 본사 주소를 방문 장소로 추측하지 않는다.
    -- 실제 지사찾기·방문 예약 안내를 기록한다.
    ADD COLUMN branch_information TEXT NULL
        COMMENT '실제 방문 지사·예약 장소 확인 방법',

    -- 공식 확인된 온라인 상담도 전화·방문과 구분한다.
    ADD COLUMN online_available BOOLEAN NULL
        COMMENT '온라인 상담 가능 여부, NULL 미확인',
    ADD COLUMN online_url VARCHAR(1000) NULL
        COMMENT '공식 온라인 상담 주소',

    -- 전화의 전국 이용 가능성과 실제 방문 지역을 분리한다.
    -- 기존 region_status 값은 보존한다.
    ADD COLUMN phone_region_status VARCHAR(20) NOT NULL DEFAULT 'unknown'
        COMMENT '전화 지역: published 지정 지역, unrestricted 전국, unknown 미확인',
    ADD COLUMN visit_region_status VARCHAR(20) NOT NULL DEFAULT 'unknown'
        COMMENT '방문 지역: published 실제 장소·지역 확인, unknown 미확인',

    ADD UNIQUE KEY uq_institution_services_institution_code (
        institution_id,
        service_code
    ),

    ADD CONSTRAINT chk_institution_services_guidance_role CHECK (
        guidance_role IN ('direct', 'related', 'unknown')
    ),

    -- BOOLEAN 컬럼에 0·1·NULL 외의 숫자가 저장되지 않도록 한다.
    ADD CONSTRAINT chk_institution_services_guidance_flags CHECK (
        (visit_reservation_required IS NULL OR visit_reservation_required IN (0, 1))
        AND (phone_weekend_available IS NULL OR phone_weekend_available IN (0, 1))
        AND (phone_holiday_available IS NULL OR phone_holiday_available IN (0, 1))
        AND (visit_weekend_available IS NULL OR visit_weekend_available IN (0, 1))
        AND (visit_holiday_available IS NULL OR visit_holiday_available IN (0, 1))
        AND (
            special_phone_weekend_available IS NULL
            OR special_phone_weekend_available IN (0, 1)
        )
        AND (
            special_phone_holiday_available IS NULL
            OR special_phone_holiday_available IN (0, 1)
        )
        AND (online_available IS NULL OR online_available IN (0, 1))
    ),

    ADD CONSTRAINT chk_institution_services_phone_region CHECK (
        phone_region_status IN ('published', 'unrestricted', 'unknown')
    ),

    ADD CONSTRAINT chk_institution_services_visit_region CHECK (
        visit_region_status IN ('published', 'unknown')
    ),

    -- 별도 시간을 기록했다면 그 시간이 적용되는 업무도 명시한다.
    ADD CONSTRAINT chk_institution_services_special_phone CHECK (
        special_phone_hours IS NULL OR special_phone_scope IS NOT NULL
    );