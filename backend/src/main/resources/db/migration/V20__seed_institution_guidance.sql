-- V20: 운영 안내·전화 지원 언어·실제 방문 지역을 등록한다.
-- 모르는 값은 NULL 또는 unknown으로 남긴다.
-- 전화 언어를 방문 언어로 복사하지 않는다.

-- 일반 상담시간과 특정 업무의 별도 상담시간을 분리한다.
-- 언어 키도 현재 선택 목록과 같은 한국어 표기를 사용한다.
-- 국가명 형태의 언어 표기는 공식 자료의 표기를 유지한다.

-- sourceUrl은 운영 안내의 공식 출처다.
-- 자료 등록일을 확인일로 사용하지 않아 확인일은 임의로 채우지 않는다.
SET @fg_v20_details = '[
  {"institutionCode":"immigration-1345","phoneHours":"평일 09:00~22:00","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"visitAvailable":0,"languageNotes":"18:00 이후에는 한국어·영어·중국어로만 안내합니다. 언어명은 공식 안내의 표기를 따랐습니다.","targetUsers":"국내 체류 외국인 등","languages":["한국어","중국어","영어","베트남어","태국어","일본어","몽골어","인도네시아어","프랑스어","방글라데시어","파키스탄어","러시아어","네팔어","캄보디아어","미얀마어","독일어","스페인어","필리핀어","아랍어","스리랑카어"],"phoneRegionStatus":"unrestricted","sourceUrl":"https://immigration.go.kr/moj/196/subview.do"},
  {"institutionCode":"danuri","phoneHours":"365일 24시간","phoneWeekendAvailable":1,"phoneHolidayAvailable":1,"visitAvailable":1,"visitReservationRequired":1,"visitHours":"내방은 예약 상담 / 찾아가는 상담은 상호 일정 조정","branchInformation":"내방할 센터와 실제 장소는 1577-1366에서 예약 시 확인","languageNotes":"서울 외 지역은 18:00 이후 대표번호로 연결됩니다.","targetUsers":"이주여성·결혼이민자·다문화가족 등 서비스별 대상","languages":["한국어","영어","중국어","베트남어","타갈로그어","크메르어","몽골어","러시아어","일본어","태국어","라오어","우즈베크어","네팔어","아랍어","인도네시아어"],"sourceUrl":"https://www.liveinkorea.kr/web/lay1/S1T40C44/contents.do","onlineAvailable":1},
  {"institutionCode":"foreign-worker","phoneHours":"09:00~18:00 상시 운영","visitAvailable":1,"visitAddress":"경기도 안산시 단원구 고잔2길 16, 에머랄드빌딩 3층","languageNotes":"HRD 안내와 EPS 안내의 일부 언어 목록이 다릅니다. 영어·타지크어 등 차이 항목과 최종 전체 목록은 전화 확인이 필요합니다.","targetUsers":"외국인근로자와 고용사업주","languages":["한국어","중국어","베트남어","태국어","타갈로그어","인도네시아어","싱할라어","몽골어","우즈베크어","크메르어","뱅골어","우르두어","네팔어","미얀마어","키르기스스탄어","동티모르어","라오어"],"sourceUrl":"https://eps.hrdkorea.or.kr/e9/user/intro/intro.do?method=workerCounseling"},
  {"institutionCode":"labor-1350","phoneHours":"평일 09:00~18:00","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"languages":["한국어","영어","중국어"],"sourceUrl":"https://1350.moel.go.kr/intro.do"},
  {"institutionCode":"fss","languages":[],"sourceUrl":"https://www.fss.or.kr/"},
  {"institutionCode":"nhis","phoneHours":"대표번호 평일 09:00~18:00 / 외국어 상담 09:00~18:00","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"visitAvailable":1,"branchInformation":"공식 홈페이지의 지사찾기·외국인민원센터에서 관할과 업무를 확인","languageNotes":"033-811-2000은 영어·중국어·베트남어·우즈베크어 상담 번호입니다.","languages":["한국어","영어","중국어","베트남어","우즈베크어"],"sourceUrl":"https://www.nhis.or.kr/english/wbheaa02000m01.do","additionalPhones":[{"phone":"033-811-2000","label":"외국어 상담","notes":"영어·중국어·베트남어·우즈베크어. 대표번호 1577-1000의 6번으로도 연결 가능합니다."}]},
  {"institutionCode":"nps","phoneHours":"대표번호 평일 09:00~18:00","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"visitAvailable":1,"branchInformation":"공식 홈페이지의 지사찾기에서 담당 지사와 업무를 확인","languages":[],"sourceUrl":"https://www.nps.or.kr/main.do"},
  {"institutionCode":"comwel","languages":[],"sourceUrl":"https://1350.moel.go.kr/rtmview.do?id=1000079274"},
  {"institutionCode":"gov24","phoneHours":"평일 09:00~18:00","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"languages":[],"sourceUrl":"https://www.gov.kr/","additionalPhones":[{"phone":"02-721-0600","label":"정부24 콜센터 추가번호","notes":"지역번호 02를 포함해 전화하세요."}]},
  {"institutionCode":"gov110","phoneHours":"휴일 포함 365일 24시간","phoneWeekendAvailable":1,"phoneHolidayAvailable":1,"languages":[],"phoneRegionStatus":"unrestricted","sourceUrl":"https://www.110.go.kr/consult/manual.do","onlineAvailable":1,"onlineUrl":"https://www.110.go.kr/consult/chat.do"},
  {"institutionCode":"nts","phoneHours":"일반 국세상담 평일 09:00~18:00","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"specialPhoneHours":"24시간","specialPhoneScope":"탈세 제보","specialPhoneWeekendAvailable":1,"specialPhoneHolidayAvailable":1,"languages":[],"phoneRegionStatus":"unrestricted","sourceUrl":"https://i.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7848&mi=13364"},
  {"institutionCode":"kinfa","phoneHours":"평일 09:00~18:00 / 18:00~20:00 일부 야간 상담","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"visitAvailable":1,"visitWeekendAvailable":0,"visitHolidayAvailable":0,"visitHours":"서민금융통합지원센터 평일 09:00~18:00","branchInformation":"공식 홈페이지의 전국센터찾기로 가까운 센터와 가능한 상담을 확인","languages":[],"sourceUrl":"https://www.kinfa.or.kr/counselingSupport/microfinanceCallCenter1397.do"},
  {"institutionCode":"ccrs","phoneHours":"평일 09:00~18:00","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"languages":[],"sourceUrl":"https://edu.ccrs.or.kr/main.do"},
  {"institutionCode":"klac","visitAvailable":1,"visitReservationRequired":1,"branchInformation":"공식 홈페이지의 방문상담 예약·지부/출장소 안내에서 실제 장소를 확인","languages":[],"sourceUrl":"https://www.klac.or.kr/","onlineAvailable":1},
  {"institutionCode":"welfare-129","phoneHours":"일반 상담 평일 09:00~18:00","phoneWeekendAvailable":0,"phoneHolidayAvailable":0,"specialPhoneHours":"365일 24시간","specialPhoneScope":"긴급복지지원·복지사각지대 등 위기대응 상담","specialPhoneWeekendAvailable":1,"specialPhoneHolidayAvailable":1,"languages":[],"phoneRegionStatus":"unrestricted","sourceUrl":"https://129.go.kr/counsel/counsel01.do"}
]';

-- V19에서 등록한 guide- 상담 업무만 운영 정보를 보완한다.
-- JSON에 없는 항목은 NULL로 읽어 '지원하지 않음'과 구분한다.

-- 예약 필수가 확인된 경우에는 예약 가능 여부도 1로 기록한다.
-- 특별 운영시간은 special_phone_scope에 적힌 업무에만 적용된다.

-- 기존 opening_hours에는 방문 상담시간을 기록한다.
-- 전화 상담시간은 phone_hours에 따로 기록한다.
UPDATE institution_services AS s
JOIN support_institutions AS i
    ON i.institution_id = s.institution_id
JOIN JSON_TABLE(
    @fg_v20_details, '$[*]'
    COLUMNS (
        institution_code VARCHAR(80) PATH '$.institutionCode',
        phone_hours VARCHAR(500) PATH '$.phoneHours',
        phone_weekend TINYINT PATH '$.phoneWeekendAvailable',
        phone_holiday TINYINT PATH '$.phoneHolidayAvailable',
        visit_available TINYINT PATH '$.visitAvailable',
        reservation_required TINYINT PATH '$.visitReservationRequired',
        visit_hours VARCHAR(500) PATH '$.visitHours',
        visit_address VARCHAR(500) PATH '$.visitAddress',
        visit_weekend TINYINT PATH '$.visitWeekendAvailable',
        visit_holiday TINYINT PATH '$.visitHolidayAvailable',
        branch_information VARCHAR(1000) PATH '$.branchInformation',
        language_notes VARCHAR(1000) PATH '$.languageNotes',
        target_users VARCHAR(500) PATH '$.targetUsers',
        special_hours VARCHAR(500) PATH '$.specialPhoneHours',
        special_scope VARCHAR(500) PATH '$.specialPhoneScope',
        special_weekend TINYINT PATH '$.specialPhoneWeekendAvailable',
        special_holiday TINYINT PATH '$.specialPhoneHolidayAvailable',
        online_available TINYINT PATH '$.onlineAvailable',
        online_url VARCHAR(1000) PATH '$.onlineUrl',
        phone_region_status VARCHAR(20) PATH '$.phoneRegionStatus',
        source_url VARCHAR(1000) PATH '$.sourceUrl',
        has_languages INT EXISTS PATH '$.languages[0]'
    )
) AS d
    ON d.institution_code = i.institution_code
SET
    s.phone_hours = d.phone_hours,
    s.phone_weekend_available = d.phone_weekend,
    s.phone_holiday_available = d.phone_holiday,
    s.visit_available = d.visit_available,
    s.visit_reservation_required = d.reservation_required,
    s.reservation_available = CASE
        WHEN d.reservation_required = 1 THEN 1
        ELSE NULL
    END,
    s.opening_hours = d.visit_hours,
    s.visit_address = d.visit_address,
    s.visit_weekend_available = d.visit_weekend,
    s.visit_holiday_available = d.visit_holiday,
    s.branch_information = d.branch_information,
    s.language_notes = d.language_notes,
    s.target_description = d.target_users,
    s.special_phone_hours = d.special_hours,
    s.special_phone_scope = d.special_scope,
    s.special_phone_weekend_available = d.special_weekend,
    s.special_phone_holiday_available = d.special_holiday,
    s.online_available = d.online_available,
    s.online_url = d.online_url,
    s.phone_region_status = COALESCE(
        d.phone_region_status,
        'unknown'
    ),
    s.language_status = CASE
        WHEN d.has_languages = 1 THEN 'published'
        ELSE 'unknown'
    END,
    s.source_url = d.source_url
WHERE s.service_code = CONCAT(
    'guide-',
    COALESCE(s.topic_code, 'administration')
);

-- 기관의 주요 이용 대상과 확인된 추가 연락처를 보완한다.
-- 추가 연락처가 없는 기관의 기존 연락처는 유지한다.
UPDATE support_institutions AS i
JOIN JSON_TABLE(
    @fg_v20_details, '$[*]'
    COLUMNS (
        row_no FOR ORDINALITY,
        institution_code VARCHAR(80) PATH '$.institutionCode',
        target_users VARCHAR(500) PATH '$.targetUsers',
        has_phones INT EXISTS PATH '$.additionalPhones'
    )
) AS d
    ON d.institution_code = i.institution_code
SET
    i.target_description = COALESCE(
        d.target_users,
        i.target_description
    ),
    i.additional_phones = CASE
        WHEN d.has_phones = 1
        THEN JSON_EXTRACT(
            @fg_v20_details,
            CONCAT('$[', d.row_no - 1, '].additionalPhones')
        )
        ELSE i.additional_phones
    END;

-- 확인된 전화 지원 언어만 phone 방식으로 연결한다.
-- 빈 목록은 언어 미확인이며, 언어를 전혀 지원하지 않는다는 뜻이 아니다.
-- 언어별 시간 조건과 전용 번호는 description에 함께 남긴다.
INSERT INTO institution_service_languages (
    service_id,
    language_code,
    consultation_method,
    description
)
SELECT
    s.service_id,
    d.language_code,
    'phone',
    d.language_notes
FROM JSON_TABLE(
    @fg_v20_details, '$[*]'
    COLUMNS (
        institution_code VARCHAR(80) PATH '$.institutionCode',
        language_notes VARCHAR(1000) PATH '$.languageNotes',
        NESTED PATH '$.languages[*]' COLUMNS (
            language_code VARCHAR(35) PATH '$'
        )
    )
) AS d
JOIN support_institutions AS i
    ON i.institution_code = d.institution_code
JOIN institution_services AS s
    ON s.institution_id = i.institution_id
WHERE d.language_code IS NOT NULL
  AND s.service_code = CONCAT(
      'guide-',
      COALESCE(s.topic_code, 'administration')
  );

-- 실제 내방 장소가 확인된 외국인력상담센터의 안산 지역을 연결한다.
-- 지역이 이미 있으면 기존 ID를 사용하고 없을 때만 추가한다.

-- FG_GUIDE_로 시작하는 값은 프로젝트 내부 코드다.
-- 공식 행정구역 코드로 표시하거나 사용하지 않는다.

-- 같은 이름의 지역이 여러 개면 단일값 조회가 실패한다.
-- 임의로 첫 번째 지역을 선택하지 않게 하기 위한 처리다.
SET @fg_v20_province = (
    SELECT region_id
    FROM regions
    WHERE region_level = 'province'
      AND region_name = '경기도'
);

-- 경기도가 없는 경우에만 상위 지역을 등록한다.
INSERT INTO regions (
    parent_region_id,
    region_level,
    region_code,
    region_name
)
SELECT
    NULL,
    'province',
    'FG_GUIDE_GYEONGGI',
    '경기도'
WHERE @fg_v20_province IS NULL;

-- 기존 지역을 사용했든 새로 등록했든 실제 ID를 다시 조회한다.
SET @fg_v20_province = (
    SELECT region_id
    FROM regions
    WHERE region_level = 'province'
      AND region_name = '경기도'
);

-- 경기도 아래의 안산시를 조회해 다른 상위 지역과 혼동하지 않는다.
SET @fg_v20_district = (
    SELECT region_id
    FROM regions
    WHERE region_level = 'district'
      AND parent_region_id = @fg_v20_province
      AND region_name = '안산시'
);

-- 안산시가 없는 경우에만 하위 지역을 등록한다.
INSERT INTO regions (
    parent_region_id,
    region_level,
    region_code,
    region_name
)
SELECT
    @fg_v20_province,
    'district',
    'FG_GUIDE_ANSAN',
    '안산시'
WHERE @fg_v20_district IS NULL;

-- 연결 테이블에는 실제로 조회된 지역 ID를 사용한다.
SET @fg_v20_district = (
    SELECT region_id
    FROM regions
    WHERE region_level = 'district'
      AND parent_region_id = @fg_v20_province
      AND region_name = '안산시'
);

-- 이 연결은 방문 장소를 뜻한다.
-- 다른 지역에 거주하면 상담을 받을 수 없다는 뜻으로 사용하지 않는다.
INSERT INTO institution_service_regions (
    service_id,
    region_id,
    consultation_method
)
SELECT
    s.service_id,
    @fg_v20_district,
    'visit'
FROM institution_services AS s
JOIN support_institutions AS i
    ON i.institution_id = s.institution_id
WHERE i.institution_code = 'foreign-worker'
  AND s.service_code IN (
      'guide-wages',
      'guide-employment_contract',
      'guide-retirement',
      'guide-employment'
  );

-- 전화 지역과 방문 장소의 확인 상태를 혼합하지 않는다.
-- 실제 장소를 연결한 서비스만 방문 지역을 published로 표시한다.
UPDATE institution_services AS s
JOIN support_institutions AS i
    ON i.institution_id = s.institution_id
SET s.visit_region_status = 'published'
WHERE i.institution_code = 'foreign-worker'
  AND s.service_code IN (
      'guide-wages',
      'guide-employment_contract',
      'guide-retirement',
      'guide-employment'
  );

-- 공식 내방 안내에서 확인된 기관 소재지도 함께 기록한다.
UPDATE support_institutions
SET
    region_id = @fg_v20_district,
    address = '경기도 안산시 단원구 고잔2길 16, 에머랄드빌딩 3층'
WHERE institution_code = 'foreign-worker';

-- 임시 등록 자료와 조회 ID를 비운다.
SET @fg_v20_details = NULL;
SET @fg_v20_province = NULL;
SET @fg_v20_district = NULL;