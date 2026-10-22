-- 기관 기본정보를 확장한다.
-- 기존 컬럼과 데이터는 유지한다.
-- 상담 업무·언어·지역 관계는 기존 연결 테이블을 사용한다.
-- 여러 값을 갖는 별칭·연락처·출처만 JSON 배열로 보관한다.
ALTER TABLE support_institutions
    -- 기관명이 바뀌어도 같은 기관을 식별할 고정 코드다.
    -- 기존 행에 코드를 임의로 만들어 넣지 않고 NULL을 허용한다.
    ADD COLUMN institution_code VARCHAR(80) NULL
        COMMENT '기관 고정 코드',

    ADD COLUMN description TEXT NULL
        COMMENT '기관 소개',

    -- 주요 이용 대상과 개별 제도의 신청 자격은 구분한다.
    ADD COLUMN target_description TEXT NULL
        COMMENT '기관의 주요 이용 대상, 개별 제도 이용 자격과 구분',

    ADD COLUMN additional_notes TEXT NULL
        COMMENT '기관 이용 참고사항',

    -- 기관 별칭 검색에 사용한다.
    ADD COLUMN search_aliases JSON NULL
        COMMENT '검색 별칭 배열',

    -- 카드에 보여줄 대표 태그다.
    -- 실제 검색용 업무 키워드는 institution_service_keywords에 연결한다.
    ADD COLUMN featured_keywords JSON NULL
        COMMENT '화면 대표 키워드 배열, 실제 검색 연결과 구분',

    -- 대표번호는 기존 phone을 사용한다.
    -- 외국어 상담·해외 이용번호 등 추가 연락처를 구분해 저장한다.
    ADD COLUMN additional_phones JSON NULL
        COMMENT '추가 연락처 배열, 각 항목은 phone, label, notes 사용',

    -- 대표 출처는 기존 source_url을 사용한다.
    ADD COLUMN additional_source_urls JSON NULL
        COMMENT '대표 source_url 외의 추가 공식 출처 배열',

    -- 확인한 범위를 기록해 전체 정보 확인으로 오해하지 않게 한다.
    ADD COLUMN verified_fields JSON NULL
        COMMENT '공식 출처에서 확인한 항목명 배열',

    ADD COLUMN verification_status VARCHAR(20) NOT NULL DEFAULT 'unknown'
        COMMENT 'unknown 미확인, partial 부분 확인, verified 전체 확인',

    -- 고정 코드가 지정된 기관끼리는 중복되지 않게 한다.
    ADD UNIQUE KEY uq_support_institutions_institution_code (institution_code),

    -- 배열을 저장할 컬럼에 객체나 문자열을 잘못 넣는 것을 막는다.
    -- 알 수 없는 값은 빈 문자열 대신 SQL NULL을 사용한다.
    ADD CONSTRAINT chk_support_institutions_json_lists CHECK (
        (search_aliases IS NULL OR JSON_TYPE(search_aliases) = 'ARRAY')
        AND (featured_keywords IS NULL OR JSON_TYPE(featured_keywords) = 'ARRAY')
        AND (additional_phones IS NULL OR JSON_TYPE(additional_phones) = 'ARRAY')
        AND (additional_source_urls IS NULL OR JSON_TYPE(additional_source_urls) = 'ARRAY')
        AND (verified_fields IS NULL OR JSON_TYPE(verified_fields) = 'ARRAY')
    ),

    -- 확인일이 있다고 전체 검증 완료로 표시하지 않는다.
    ADD CONSTRAINT chk_support_institutions_verification CHECK (
        verification_status IN ('unknown', 'partial', 'verified')
    );