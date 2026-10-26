-- 신규 4개 기관의 확인된 정보만 등록한다. 기존 15곳과 별도 단계로 적용할 수 있다.
-- 기존 기관 보완 V25 적용 후 사용하며 같은 기관 코드가 이미 존재하면 사전 점검에서 중단한다.
-- 미확인 값은 NULL/unknown, 언어목록 미확인은 빈 배열로 둔다.
START TRANSACTION;

-- 서울 방문기관의 실제 위치를 연결하기 위해 필요한 지역을 먼저 등록한다.
SET @fg_v26_seoul_id = (
    SELECT MIN(region_id)
    FROM regions
    WHERE region_level = 'province'
      AND region_name = '서울특별시'
);

INSERT INTO regions (
    parent_region_id, region_level, region_code, region_name
)
SELECT NULL, 'province', 'FG_GUIDE_SEOUL', '서울특별시'
WHERE @fg_v26_seoul_id IS NULL;

SET @fg_v26_seoul_id = (
    SELECT MIN(region_id)
    FROM regions
    WHERE region_level = 'province'
      AND region_name = '서울특별시'
);

-- 같은 서울특별시 아래에 해당 구가 있으면 기존 지역을 사용한다.
INSERT INTO regions (
    parent_region_id, region_level, region_code, region_name
)
SELECT
    @fg_v26_seoul_id,
    'district',
    d.region_code,
    d.region_name
FROM (
    SELECT 'FG_GUIDE_SEOUL_GANGSEO' AS region_code, '강서구' AS region_name
    UNION ALL
    SELECT 'FG_GUIDE_SEOUL_YEONGDEUNGPO', '영등포구'
    UNION ALL
    SELECT 'FG_GUIDE_SEOUL_SONGPA', '송파구'
) d
LEFT JOIN regions r
    ON r.parent_region_id = @fg_v26_seoul_id
   AND r.region_level = 'district'
   AND r.region_name = d.region_name
WHERE r.region_id IS NULL;

-- HUG 전세피해 및 예방지원센터(서울)
-- 출처: https://www.khug.or.kr/jeonse/web/s01/s010001.jsp
-- https://www.khug.or.kr/jeonse/web/s01/s010002.jsp
-- https://www.khug.or.kr/jeonse/web/s04/s040401.jsp
INSERT INTO support_institutions (
    institution_code, institution_name, institution_type, address, phone, opening_hours, website_url, is_example, source_url, as_of, checked_at, description, target_description, additional_notes, search_aliases, featured_keywords, additional_phones, additional_source_urls, verified_fields, verification_status, guidance_data
) VALUES (
    'hug-jeonse-seoul',
    'HUG 전세피해 및 예방지원센터(서울)',
    'public',
    '서울특별시 강서구 화곡로 179 대한상공회의소 서울기술교육센터 2층',
    '02-6917-8119',
    '센터 상담시간: 평일 10:00~17:00(12:00~13:00 제외). 통합콜센터 1533-8119의 운영시간은 별도 확인.',
    'https://www.khug.or.kr/jeonse/web/s01/s010001.jsp',
    0,
    'https://www.khug.or.kr/jeonse/web/s01/s010001.jsp',
    '2026-10-26',
    '2026-10-26 00:00:00',
    '전세보증금 미반환 피해와 피해 우려에 관한 상담 및 지원 프로그램 연계 창구',
    '전세보증금을 반환받지 못했거나 반환받지 못할 우려가 있는 임차인. 개별 지원사업의 대상 요건은 별도 확인.',
    '서울 강서센터의 상담 안내입니다. 통합콜센터 1533-8119 및 다른 지역센터는 연락처와 운영조건을 별도로 확인하세요.',
    JSON_ARRAY('HUG 전세피해 및 예방지원센터(서울)', '02-6917-8119', '전세', '보증금', '보증금 반환', '임대차', '주거비 지원', '주거지원금'),
    JSON_ARRAY('전세', '보증금', '보증금 반환', '임대차', '주거비 지원', '주거지원금'),
    JSON_ARRAY(JSON_OBJECT('phone', '1533-8119', 'label', '전세피해 통합콜센터', 'notes', '서울 강서센터 직통번호와 구분. 운영시간은 별도 확인.'), JSON_OBJECT('phone', '1588-1663', 'label', '경·공매 지원 전용', 'notes', '전세사기피해자 경·공매 지원 업무. 일반 센터 상담번호와 구분.')),
    JSON_ARRAY('https://www.khug.or.kr/jeonse/web/s01/s010002.jsp', 'https://www.khug.or.kr/jeonse/web/s04/s040401.jsp'),
    JSON_ARRAY('name', 'phone', 'visitAddress', 'scopeNotes', 'sourceUrls'),
    'partial',
    JSON_OBJECT('detail', JSON_OBJECT('기관위치_전화지역', '서울특별시 강서구 화곡로 179 대한상공회의소 서울기술교육센터 2층', '상담방식', '전화, 방문', '방문예약필수여부', '법률상담 예약 절차 운영. 일반 방문의 예약 필수 여부는 센터에 확인 필요.', '전화지원언어', '현행 지원언어 목록 확인 필요', '방문지원언어', '방문 상담언어는 사전 문의 필요', '주말전화', '전화상담 미운영', '공휴일전화', '전화상담 미운영', '주말방문', '미운영', '공휴일방문', '미운영'))
);
INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-housing',
    'housing',
    '전세보증금 미반환·전세피해 상담',
    '전세보증금 미반환·전세피해 상담',
    CONCAT('전세피해에 관한 법률·주거·금융지원 제도를 안내하고 필요한 지원 프로그램을 연결합니다.', CHAR(10), '상담이 곧 전세사기피해자 결정이나 보증금 반환, 대출 승인·지원 확정을 뜻하지는 않습니다. 각 프로그램의 요건과 절차가 따로 있습니다.', CHAR(10), '법률상담 예약과 일반 센터 이용은 구분해서 확인하세요. 외국인의 지원 가능 여부는 사업별로 확인해야 합니다.'),
    '전세보증금을 반환받지 못했거나 반환받지 못할 우려가 있는 임차인. 개별 지원사업의 대상 요건은 별도 확인.',
    'direct',
    1,
    '02-6917-8119',
    '센터 상담시간: 평일 10:00~17:00(12:00~13:00 제외). 통합콜센터 1533-8119의 운영시간은 별도 확인.',
    0,
    0,
    'unknown',
    1,
    '서울특별시 강서구 화곡로 179 대한상공회의소 서울기술교육센터 2층',
    '평일 10:00~17:00(12:00~13:00 제외)',
    0,
    0,
    NULL,
    NULL,
    'published',
    '이 항목은 서울 강서센터입니다. 인천·경기 등 다른 지역센터의 주소와 전화는 공식 지역별 센터 안내에서 확인하세요.',
    'unknown',
    'published',
    '한국어 외 전화·방문 상담 지원언어의 현행 공식 목록은 확인하지 못했습니다. 필요 언어의 상담·통역 가능 여부를 센터에 문의하세요.',
    '서울 강서센터 02-6917-8119 / 전세피해 통합콜센터 1533-8119 / 경·공매 지원 전용 1588-1663(업무가 다름)',
    NULL,
    NULL,
    'https://www.khug.or.kr/jeonse/web/s01/s010001.jsp',
    '2026-10-26',
    '2026-10-26 00:00:00',
    1
FROM support_institutions i WHERE i.institution_code = 'hug-jeonse-seoul';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '전세' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'hug-jeonse-seoul' AND s.service_code = 'guide-housing';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '보증금' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'hug-jeonse-seoul' AND s.service_code = 'guide-housing';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '보증금 반환' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'hug-jeonse-seoul' AND s.service_code = 'guide-housing';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '임대차' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'hug-jeonse-seoul' AND s.service_code = 'guide-housing';
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '강서구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'hug-jeonse-seoul'
  AND s.service_code = 'guide-housing'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '강서구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '강서구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) AND x.consultation_method = 'visit'
  );

INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-financial_support',
    'financial_support',
    '전세피해 주거·금융지원 제도 연계',
    '전세피해 주거·금융지원 제도 연계',
    CONCAT('전세피해에 관한 법률·주거·금융지원 제도를 안내하고 필요한 지원 프로그램을 연결합니다.', CHAR(10), '상담이 곧 전세사기피해자 결정이나 보증금 반환, 대출 승인·지원 확정을 뜻하지는 않습니다. 각 프로그램의 요건과 절차가 따로 있습니다.', CHAR(10), '법률상담 예약과 일반 센터 이용은 구분해서 확인하세요. 외국인의 지원 가능 여부는 사업별로 확인해야 합니다.'),
    '전세보증금을 반환받지 못했거나 반환받지 못할 우려가 있는 임차인. 개별 지원사업의 대상 요건은 별도 확인.',
    'related',
    1,
    '02-6917-8119',
    '센터 상담시간: 평일 10:00~17:00(12:00~13:00 제외). 통합콜센터 1533-8119의 운영시간은 별도 확인.',
    0,
    0,
    'unknown',
    1,
    '서울특별시 강서구 화곡로 179 대한상공회의소 서울기술교육센터 2층',
    '평일 10:00~17:00(12:00~13:00 제외)',
    0,
    0,
    NULL,
    NULL,
    'published',
    '이 항목은 서울 강서센터입니다. 인천·경기 등 다른 지역센터의 주소와 전화는 공식 지역별 센터 안내에서 확인하세요.',
    'unknown',
    'published',
    '한국어 외 전화·방문 상담 지원언어의 현행 공식 목록은 확인하지 못했습니다. 필요 언어의 상담·통역 가능 여부를 센터에 문의하세요.',
    '서울 강서센터 02-6917-8119 / 전세피해 통합콜센터 1533-8119 / 경·공매 지원 전용 1588-1663(업무가 다름)',
    NULL,
    NULL,
    'https://www.khug.or.kr/jeonse/web/s01/s010001.jsp',
    '2026-10-26',
    '2026-10-26 00:00:00',
    2
FROM support_institutions i WHERE i.institution_code = 'hug-jeonse-seoul';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '주거비 지원' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'hug-jeonse-seoul' AND s.service_code = 'guide-financial_support';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '주거지원금' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'hug-jeonse-seoul' AND s.service_code = 'guide-financial_support';
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '강서구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'hug-jeonse-seoul'
  AND s.service_code = 'guide-financial_support'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '강서구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '강서구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) AND x.consultation_method = 'visit'
  );

-- 서울외국인주민센터
-- 출처: https://global.seoul.go.kr/
-- https://global.seoul.go.kr/hmpg/ainf/ctrs/frct/srch/dopr/doprListPage.do?cntr_no=04E34E2046394333BCC451C20A4850D9
-- https://global.seoul.go.kr/hmpg/ainf/ctrs/frct/srch/orgn/orgnListPage.do?cntr_no=04E34E2046394333BCC451C20A4850D9
-- https://mediahub.seoul.go.kr/archives/2019311
INSERT INTO support_institutions (
    institution_code, institution_name, institution_type, address, phone, opening_hours, website_url, is_example, source_url, as_of, checked_at, description, target_description, additional_notes, search_aliases, featured_keywords, additional_phones, additional_source_urls, verified_fields, verification_status, guidance_data
) VALUES (
    'seoul-foreign-resident',
    '서울외국인주민센터',
    'local',
    '서울특별시 영등포구 도신로 40',
    '02-2229-4900',
    '일반 상담: 월~금·일요일 운영, 언어별 요일·시간 상이. 정확한 시작·종료시간은 사전 문의.',
    'https://global.seoul.go.kr/',
    0,
    'https://global.seoul.go.kr/',
    '2026-10-26',
    '2026-10-26 00:00:00',
    '서울 생활 정착과 법률·노무·행정·생활정보에 관한 다국어 상담 지원기관',
    '외국인주민 등 상담이 필요한 이용자. 개별 사업의 서울 거주·생활권 등 대상 요건은 별도 확인.',
    '일반 다국어 상담과 전문가 상담의 예약·운영일정은 다릅니다. 공식 화면 사이의 언어별 세부 시간이 달라 방문 전 해당 언어 상담 일정과 종료시간을 확인하세요.',
    JSON_ARRAY('서울외국인주민센터', '02-2229-4900', '생활정보', '생활통역', '법률상담', '외국인등록', '비자', '임금', '임금 체불', '근로계약', '근무조건', '퇴직금', '퇴직금 미지급', '임대차', '보증금'),
    JSON_ARRAY('생활정보', '생활통역', '법률상담', '외국인등록', '비자', '임금'),
    JSON_ARRAY(JSON_OBJECT('phone', '02-2229-4911', 'label', '중국어 상담', 'notes', '상담일·시간 사전 확인'), JSON_OBJECT('phone', '02-2229-4912', 'label', '영어 상담', 'notes', '상담일·시간 사전 확인'), JSON_OBJECT('phone', '02-2229-4914', 'label', '베트남어 상담', 'notes', '상담일·시간 사전 확인'), JSON_OBJECT('phone', '02-2229-4915', 'label', '몽골어 상담', 'notes', '상담일·시간 사전 확인'), JSON_OBJECT('phone', '02-2229-4916', 'label', '러시아어·우즈베크어 상담', 'notes', '언어별 요일이 다름. 사전 확인'), JSON_OBJECT('phone', '02-2229-4913', 'label', '우르두어 상담 문의', 'notes', '우르두어 일요일 상담 안내. 다른 요일의 해당 번호 업무와 구분')),
    JSON_ARRAY('https://global.seoul.go.kr/hmpg/ainf/ctrs/frct/srch/dopr/doprListPage.do?cntr_no=04E34E2046394333BCC451C20A4850D9', 'https://global.seoul.go.kr/hmpg/ainf/ctrs/frct/srch/orgn/orgnListPage.do?cntr_no=04E34E2046394333BCC451C20A4850D9', 'https://mediahub.seoul.go.kr/archives/2019311'),
    JSON_ARRAY('name', 'phone', 'visitAddress', 'scopeNotes', 'sourceUrls'),
    'partial',
    JSON_OBJECT('detail', JSON_OBJECT('기관위치_전화지역', '서울특별시 영등포구 도신로 40', '상담방식', '전화, 방문', '방문예약필수여부', '전문상담은 사전 예약·일정 확인 필요. 일반 다국어 상담의 예약 필수 여부는 문의.', '전화지원언어', '한국어, 영어, 중국어, 베트남어, 몽골어, 러시아어, 우즈베크어, 우르두어 (언어별 일정·연결 조건은 아래 언어 이용 조건 참고)', '방문지원언어', '한국어, 영어, 중국어, 베트남어, 몽골어, 러시아어, 우즈베크어, 우르두어 (언어별 요일·시간 사전 확인)', '주말전화', '일요일 운영(토요일 운영으로 해석하지 않음; 상담시간 참고)', '공휴일전화', '공휴일 운영 여부는 사전 문의 필요', '주말방문', '일요일 운영(상담시간·예약조건 확인)', '공휴일방문', '공휴일 방문 가능 여부는 사전 문의 필요'))
);
INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-administration',
    NULL,
    '다국어 생활·행정·법률 상담 및 기관 연결',
    '다국어 생활·행정·법률 상담 및 기관 연결',
    CONCAT('한국 생활 정착과 생활정보, 법률·노무·행정 관련 문제에 대해 다국어 상담과 필요한 기관 연결을 지원합니다.', CHAR(10), '일반 상담·통역과 변호사·노무사 등 전문가의 상담은 구분됩니다. 전문가 상담의 예약 가능 일정과 필요한 통역을 미리 문의하세요.', CHAR(10), '체류허가, 노동사건 처분 및 지원사업의 승인 등은 각각 담당기관의 절차에 따라 이루어집니다. 상담만으로 신청·허가가 완료되는 것은 아닙니다.'),
    '외국인주민 등 상담이 필요한 이용자. 개별 사업의 서울 거주·생활권 등 대상 요건은 별도 확인.',
    'related',
    1,
    '02-2229-4900',
    '일반 상담: 월~금·일요일 운영, 언어별 요일·시간 상이. 정확한 시작·종료시간은 사전 문의.',
    1,
    NULL,
    'unknown',
    1,
    '서울특별시 영등포구 도신로 40',
    '일반 상담: 월~금·일요일 운영, 언어별 시간 상이. 전문가 상담은 별도 일정·예약 확인.',
    1,
    NULL,
    NULL,
    NULL,
    'published',
    '서울 영등포구 도신로 40 서울외국인주민센터입니다. 종로의 서울글로벌센터와 다른 기관이므로 장소를 구분하세요.',
    'published',
    'published',
    '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.',
    '대표 02-2229-4900 / 언어별 직통번호는 아래 추가 연락처 참고',
    NULL,
    NULL,
    'https://global.seoul.go.kr/',
    '2026-10-26',
    '2026-10-26 00:00:00',
    1
FROM support_institutions i WHERE i.institution_code = 'seoul-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '생활정보' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '생활통역' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '법률상담' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '외국인등록' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '비자' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'visit');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident'
  AND s.service_code = 'guide-administration'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) AND x.consultation_method = 'visit'
  );

INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-wages',
    'wages',
    '임금 관련 다국어 고충상담 및 전문상담 연결',
    '임금 관련 다국어 고충상담 및 전문상담 연결',
    CONCAT('한국 생활 정착과 생활정보, 법률·노무·행정 관련 문제에 대해 다국어 상담과 필요한 기관 연결을 지원합니다.', CHAR(10), '일반 상담·통역과 변호사·노무사 등 전문가의 상담은 구분됩니다. 전문가 상담의 예약 가능 일정과 필요한 통역을 미리 문의하세요.', CHAR(10), '체류허가, 노동사건 처분 및 지원사업의 승인 등은 각각 담당기관의 절차에 따라 이루어집니다. 상담만으로 신청·허가가 완료되는 것은 아닙니다.'),
    '외국인주민 등 상담이 필요한 이용자. 개별 사업의 서울 거주·생활권 등 대상 요건은 별도 확인.',
    'related',
    1,
    '02-2229-4900',
    '일반 상담: 월~금·일요일 운영, 언어별 요일·시간 상이. 정확한 시작·종료시간은 사전 문의.',
    1,
    NULL,
    'unknown',
    1,
    '서울특별시 영등포구 도신로 40',
    '일반 상담: 월~금·일요일 운영, 언어별 시간 상이. 전문가 상담은 별도 일정·예약 확인.',
    1,
    NULL,
    NULL,
    NULL,
    'published',
    '서울 영등포구 도신로 40 서울외국인주민센터입니다. 종로의 서울글로벌센터와 다른 기관이므로 장소를 구분하세요.',
    'published',
    'published',
    '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.',
    '대표 02-2229-4900 / 언어별 직통번호는 아래 추가 연락처 참고',
    NULL,
    NULL,
    'https://global.seoul.go.kr/',
    '2026-10-26',
    '2026-10-26 00:00:00',
    2
FROM support_institutions i WHERE i.institution_code = 'seoul-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '임금' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '임금 체불' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'visit');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident'
  AND s.service_code = 'guide-wages'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) AND x.consultation_method = 'visit'
  );

INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-employment_contract',
    'employment_contract',
    '근로계약·노무 문제 상담 및 전문상담 연결',
    '근로계약·노무 문제 상담 및 전문상담 연결',
    CONCAT('한국 생활 정착과 생활정보, 법률·노무·행정 관련 문제에 대해 다국어 상담과 필요한 기관 연결을 지원합니다.', CHAR(10), '일반 상담·통역과 변호사·노무사 등 전문가의 상담은 구분됩니다. 전문가 상담의 예약 가능 일정과 필요한 통역을 미리 문의하세요.', CHAR(10), '체류허가, 노동사건 처분 및 지원사업의 승인 등은 각각 담당기관의 절차에 따라 이루어집니다. 상담만으로 신청·허가가 완료되는 것은 아닙니다.'),
    '외국인주민 등 상담이 필요한 이용자. 개별 사업의 서울 거주·생활권 등 대상 요건은 별도 확인.',
    'related',
    1,
    '02-2229-4900',
    '일반 상담: 월~금·일요일 운영, 언어별 요일·시간 상이. 정확한 시작·종료시간은 사전 문의.',
    1,
    NULL,
    'unknown',
    1,
    '서울특별시 영등포구 도신로 40',
    '일반 상담: 월~금·일요일 운영, 언어별 시간 상이. 전문가 상담은 별도 일정·예약 확인.',
    1,
    NULL,
    NULL,
    NULL,
    'published',
    '서울 영등포구 도신로 40 서울외국인주민센터입니다. 종로의 서울글로벌센터와 다른 기관이므로 장소를 구분하세요.',
    'published',
    'published',
    '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.',
    '대표 02-2229-4900 / 언어별 직통번호는 아래 추가 연락처 참고',
    NULL,
    NULL,
    'https://global.seoul.go.kr/',
    '2026-10-26',
    '2026-10-26 00:00:00',
    3
FROM support_institutions i WHERE i.institution_code = 'seoul-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '근로계약' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '근무조건' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-employment_contract'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'visit');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident'
  AND s.service_code = 'guide-employment_contract'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) AND x.consultation_method = 'visit'
  );

INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-retirement',
    'retirement',
    '퇴직금 관련 고충상담 및 전문상담 연결',
    '퇴직금 관련 고충상담 및 전문상담 연결',
    CONCAT('한국 생활 정착과 생활정보, 법률·노무·행정 관련 문제에 대해 다국어 상담과 필요한 기관 연결을 지원합니다.', CHAR(10), '일반 상담·통역과 변호사·노무사 등 전문가의 상담은 구분됩니다. 전문가 상담의 예약 가능 일정과 필요한 통역을 미리 문의하세요.', CHAR(10), '체류허가, 노동사건 처분 및 지원사업의 승인 등은 각각 담당기관의 절차에 따라 이루어집니다. 상담만으로 신청·허가가 완료되는 것은 아닙니다.'),
    '외국인주민 등 상담이 필요한 이용자. 개별 사업의 서울 거주·생활권 등 대상 요건은 별도 확인.',
    'related',
    1,
    '02-2229-4900',
    '일반 상담: 월~금·일요일 운영, 언어별 요일·시간 상이. 정확한 시작·종료시간은 사전 문의.',
    1,
    NULL,
    'unknown',
    1,
    '서울특별시 영등포구 도신로 40',
    '일반 상담: 월~금·일요일 운영, 언어별 시간 상이. 전문가 상담은 별도 일정·예약 확인.',
    1,
    NULL,
    NULL,
    NULL,
    'published',
    '서울 영등포구 도신로 40 서울외국인주민센터입니다. 종로의 서울글로벌센터와 다른 기관이므로 장소를 구분하세요.',
    'published',
    'published',
    '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.',
    '대표 02-2229-4900 / 언어별 직통번호는 아래 추가 연락처 참고',
    NULL,
    NULL,
    'https://global.seoul.go.kr/',
    '2026-10-26',
    '2026-10-26 00:00:00',
    4
FROM support_institutions i WHERE i.institution_code = 'seoul-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '퇴직금' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '퇴직금 미지급' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'visit');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident'
  AND s.service_code = 'guide-retirement'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) AND x.consultation_method = 'visit'
  );

INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-housing',
    'housing',
    '주거 관련 생활상담 및 전문상담 연결',
    '주거 관련 생활상담 및 전문상담 연결',
    CONCAT('한국 생활 정착과 생활정보, 법률·노무·행정 관련 문제에 대해 다국어 상담과 필요한 기관 연결을 지원합니다.', CHAR(10), '일반 상담·통역과 변호사·노무사 등 전문가의 상담은 구분됩니다. 전문가 상담의 예약 가능 일정과 필요한 통역을 미리 문의하세요.', CHAR(10), '체류허가, 노동사건 처분 및 지원사업의 승인 등은 각각 담당기관의 절차에 따라 이루어집니다. 상담만으로 신청·허가가 완료되는 것은 아닙니다.'),
    '외국인주민 등 상담이 필요한 이용자. 개별 사업의 서울 거주·생활권 등 대상 요건은 별도 확인.',
    'related',
    1,
    '02-2229-4900',
    '일반 상담: 월~금·일요일 운영, 언어별 요일·시간 상이. 정확한 시작·종료시간은 사전 문의.',
    1,
    NULL,
    'unknown',
    1,
    '서울특별시 영등포구 도신로 40',
    '일반 상담: 월~금·일요일 운영, 언어별 시간 상이. 전문가 상담은 별도 일정·예약 확인.',
    1,
    NULL,
    NULL,
    NULL,
    'published',
    '서울 영등포구 도신로 40 서울외국인주민센터입니다. 종로의 서울글로벌센터와 다른 기관이므로 장소를 구분하세요.',
    'published',
    'published',
    '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.',
    '대표 02-2229-4900 / 언어별 직통번호는 아래 추가 연락처 참고',
    NULL,
    NULL,
    'https://global.seoul.go.kr/',
    '2026-10-26',
    '2026-10-26 00:00:00',
    5
FROM support_institutions i WHERE i.institution_code = 'seoul-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '임대차' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '보증금' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'phone', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'visit');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우르두어', 'visit', '기관 안내의 지원언어: 한국어·영어·중국어·베트남어·몽골어·러시아어·우즈베크어·우르두어. 러시아어는 수·금, 우르두어는 일요일로 안내됩니다. 우즈베크어 요일과 언어별 시작·종료시간은 공식 화면 사이 차이가 있어 사전 문의가 필요합니다. 모든 언어가 매일 제공되는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident' AND s.service_code = 'guide-housing'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우르두어' AND l.consultation_method = 'visit');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'seoul-foreign-resident'
  AND s.service_code = 'guide-housing'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '영등포구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) AND x.consultation_method = 'visit'
  );

-- 안산시외국인주민상담지원센터
-- 출처: https://www.ansan.go.kr/global/common/cntnts/selectContents.do?cntnts_id=C0000991
-- https://www.gg.go.kr/bbs/boardView.do?bIdx=42369500&bsIdx=647&menuId=1886
-- https://k-foreigner.com/
INSERT INTO support_institutions (
    institution_code, institution_name, institution_type, address, phone, opening_hours, website_url, is_example, source_url, as_of, checked_at, description, target_description, additional_notes, search_aliases, featured_keywords, additional_phones, additional_source_urls, verified_fields, verification_status, guidance_data
) VALUES (
    'ansan-foreign-resident',
    '안산시외국인주민상담지원센터',
    'local',
    '경기도 안산시 단원구 부부로 43 안산시외국인주민지원본부 1층',
    '1644-7111',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 금·토·공휴일 휴무.',
    'https://www.ansan.go.kr/global/common/cntnts/selectContents.do?cntnts_id=C0000991',
    0,
    'https://www.ansan.go.kr/global/common/cntnts/selectContents.do?cntnts_id=C0000991',
    '2026-10-26',
    '2026-10-26 00:00:00',
    '외국인주민의 노동·생활·법률 등 고충에 관한 다국어 상담기관',
    '상담이 필요한 외국인주민. 개별 지원사업과 방문 이용 대상의 제한 여부는 별도 문의.',
    '1577-0071 외국인력상담센터와 다른 기관입니다. 운영 요일·공휴일 휴무는 공식 안산시 안내와 센터 홈페이지를 함께 확인했으며, 방문상담 언어와 예약 조건은 사전 문의가 필요합니다.',
    JSON_ARRAY('안산시외국인주민상담지원센터', '1644-7111', '생활정보', '생활통역', '법률상담', '비자', '임금', '임금 체불', '퇴직금', '퇴직금 미지급', '산재보험', '산재'),
    JSON_ARRAY('생활정보', '생활통역', '법률상담', '비자', '임금', '임금 체불'),
    JSON_ARRAY(),
    JSON_ARRAY('https://www.gg.go.kr/bbs/boardView.do?bIdx=42369500&bsIdx=647&menuId=1886', 'https://k-foreigner.com/'),
    JSON_ARRAY('name', 'phone', 'visitAddress', 'scopeNotes', 'sourceUrls'),
    'partial',
    JSON_OBJECT('detail', JSON_OBJECT('기관위치_전화지역', '경기도 안산시 단원구 부부로 43 안산시외국인주민지원본부 1층', '상담방식', '전화, 방문', '방문예약필수여부', '내방상담 제공은 확인. 예약 필수 여부와 언어별 상담 가능 일정은 사전 문의.', '전화지원언어', '한국어, 영어, 중국어, 베트남어, 몽골어, 인도네시아어, 말레이어, 러시아어, 우즈베크어, 태국어, 필리핀어, 싱할라어, 크메르어, 네팔어 (언어별 일정·연결 조건은 아래 언어 이용 조건 참고)', '방문지원언어', '방문 상담언어는 사전 문의 필요', '주말전화', '일요일 운영(토요일 운영으로 해석하지 않음; 상담시간 참고)', '공휴일전화', '전화상담 미운영', '주말방문', '일요일 운영(상담시간·예약조건 확인)', '공휴일방문', '미운영'))
);
INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-administration',
    NULL,
    '다국어 생활·체류·법률 고충상담',
    '다국어 생활·체류·법률 고충상담',
    CONCAT('임금·퇴직금 등 노동 문제와 법률·생활 고충에 관한 다국어 상담과 통역·기관 안내를 제공합니다.', CHAR(10), '전화·내방·영상 상담을 공식 안내합니다. 상담과 실제 노동사건의 조사·처분 또는 소송 진행은 구분됩니다.', CHAR(10), '지원언어의 상담원 배치와 방문 일정은 달라질 수 있습니다. 전화 ARS 지원언어가 방문 시에도 모두 즉시 제공된다는 뜻은 아닙니다.'),
    '상담이 필요한 외국인주민. 개별 지원사업과 방문 이용 대상의 제한 여부는 별도 문의.',
    'related',
    1,
    '1644-7111',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 금·토·공휴일 휴무.',
    1,
    0,
    'unknown',
    1,
    '경기도 안산시 단원구 부부로 43 안산시외국인주민지원본부 1층',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 방문 전 상담언어·예약 확인.',
    1,
    0,
    NULL,
    NULL,
    'published',
    '경기도의 2026년 3월 시설 현황과 센터 홈페이지가 부부로 43, 1층으로 일치합니다.',
    'published',
    'published',
    '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.',
    '1644-7111 → ARS 언어 선택. 1577-0071 외국인력상담센터와 구분하세요.',
    NULL,
    NULL,
    'https://www.ansan.go.kr/global/common/cntnts/selectContents.do?cntnts_id=C0000991',
    '2026-10-26',
    '2026-10-26 00:00:00',
    1
FROM support_institutions i WHERE i.institution_code = 'ansan-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '생활정보' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '생활통역' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '법률상담' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '비자' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '인도네시아어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '인도네시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '말레이어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '말레이어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '태국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '태국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '필리핀어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '필리핀어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '싱할라어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '싱할라어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '크메르어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '크메르어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '네팔어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-administration'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '네팔어' AND l.consultation_method = 'phone');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident'
  AND s.service_code = 'guide-administration'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) AND x.consultation_method = 'visit'
  );

INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-wages',
    'wages',
    '임금·체불 관련 고충상담',
    '임금·체불 관련 고충상담',
    CONCAT('임금·퇴직금 등 노동 문제와 법률·생활 고충에 관한 다국어 상담과 통역·기관 안내를 제공합니다.', CHAR(10), '전화·내방·영상 상담을 공식 안내합니다. 상담과 실제 노동사건의 조사·처분 또는 소송 진행은 구분됩니다.', CHAR(10), '지원언어의 상담원 배치와 방문 일정은 달라질 수 있습니다. 전화 ARS 지원언어가 방문 시에도 모두 즉시 제공된다는 뜻은 아닙니다.'),
    '상담이 필요한 외국인주민. 개별 지원사업과 방문 이용 대상의 제한 여부는 별도 문의.',
    'direct',
    1,
    '1644-7111',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 금·토·공휴일 휴무.',
    1,
    0,
    'unknown',
    1,
    '경기도 안산시 단원구 부부로 43 안산시외국인주민지원본부 1층',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 방문 전 상담언어·예약 확인.',
    1,
    0,
    NULL,
    NULL,
    'published',
    '경기도의 2026년 3월 시설 현황과 센터 홈페이지가 부부로 43, 1층으로 일치합니다.',
    'published',
    'published',
    '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.',
    '1644-7111 → ARS 언어 선택. 1577-0071 외국인력상담센터와 구분하세요.',
    NULL,
    NULL,
    'https://www.ansan.go.kr/global/common/cntnts/selectContents.do?cntnts_id=C0000991',
    '2026-10-26',
    '2026-10-26 00:00:00',
    2
FROM support_institutions i WHERE i.institution_code = 'ansan-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '임금' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '임금 체불' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '인도네시아어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '인도네시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '말레이어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '말레이어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '태국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '태국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '필리핀어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '필리핀어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '싱할라어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '싱할라어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '크메르어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '크메르어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '네팔어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-wages'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '네팔어' AND l.consultation_method = 'phone');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident'
  AND s.service_code = 'guide-wages'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) AND x.consultation_method = 'visit'
  );

INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-retirement',
    'retirement',
    '퇴직금 관련 고충상담',
    '퇴직금 관련 고충상담',
    CONCAT('임금·퇴직금 등 노동 문제와 법률·생활 고충에 관한 다국어 상담과 통역·기관 안내를 제공합니다.', CHAR(10), '전화·내방·영상 상담을 공식 안내합니다. 상담과 실제 노동사건의 조사·처분 또는 소송 진행은 구분됩니다.', CHAR(10), '지원언어의 상담원 배치와 방문 일정은 달라질 수 있습니다. 전화 ARS 지원언어가 방문 시에도 모두 즉시 제공된다는 뜻은 아닙니다.'),
    '상담이 필요한 외국인주민. 개별 지원사업과 방문 이용 대상의 제한 여부는 별도 문의.',
    'direct',
    1,
    '1644-7111',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 금·토·공휴일 휴무.',
    1,
    0,
    'unknown',
    1,
    '경기도 안산시 단원구 부부로 43 안산시외국인주민지원본부 1층',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 방문 전 상담언어·예약 확인.',
    1,
    0,
    NULL,
    NULL,
    'published',
    '경기도의 2026년 3월 시설 현황과 센터 홈페이지가 부부로 43, 1층으로 일치합니다.',
    'published',
    'published',
    '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.',
    '1644-7111 → ARS 언어 선택. 1577-0071 외국인력상담센터와 구분하세요.',
    NULL,
    NULL,
    'https://www.ansan.go.kr/global/common/cntnts/selectContents.do?cntnts_id=C0000991',
    '2026-10-26',
    '2026-10-26 00:00:00',
    3
FROM support_institutions i WHERE i.institution_code = 'ansan-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '퇴직금' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '퇴직금 미지급' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '인도네시아어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '인도네시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '말레이어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '말레이어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '태국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '태국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '필리핀어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '필리핀어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '싱할라어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '싱할라어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '크메르어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '크메르어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '네팔어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-retirement'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '네팔어' AND l.consultation_method = 'phone');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident'
  AND s.service_code = 'guide-retirement'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) AND x.consultation_method = 'visit'
  );

INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-insurance',
    'insurance',
    '산재 등 사회보험 관련 상담과 담당기관 안내',
    '산재 등 사회보험 관련 상담과 담당기관 안내',
    CONCAT('임금·퇴직금 등 노동 문제와 법률·생활 고충에 관한 다국어 상담과 통역·기관 안내를 제공합니다.', CHAR(10), '전화·내방·영상 상담을 공식 안내합니다. 상담과 실제 노동사건의 조사·처분 또는 소송 진행은 구분됩니다.', CHAR(10), '지원언어의 상담원 배치와 방문 일정은 달라질 수 있습니다. 전화 ARS 지원언어가 방문 시에도 모두 즉시 제공된다는 뜻은 아닙니다.'),
    '상담이 필요한 외국인주민. 개별 지원사업과 방문 이용 대상의 제한 여부는 별도 문의.',
    'related',
    1,
    '1644-7111',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 금·토·공휴일 휴무.',
    1,
    0,
    'unknown',
    1,
    '경기도 안산시 단원구 부부로 43 안산시외국인주민지원본부 1층',
    '월~목 09:00~18:00, 일요일 10:00~19:00(센터 안내 휴게 12:00~13:00). 방문 전 상담언어·예약 확인.',
    1,
    0,
    NULL,
    NULL,
    'published',
    '경기도의 2026년 3월 시설 현황과 센터 홈페이지가 부부로 43, 1층으로 일치합니다.',
    'published',
    'published',
    '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.',
    '1644-7111 → ARS 언어 선택. 1577-0071 외국인력상담센터와 구분하세요.',
    NULL,
    NULL,
    'https://www.ansan.go.kr/global/common/cntnts/selectContents.do?cntnts_id=C0000991',
    '2026-10-26',
    '2026-10-26 00:00:00',
    4
FROM support_institutions i WHERE i.institution_code = 'ansan-foreign-resident';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '산재보험' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '산재' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '한국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '한국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '몽골어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '몽골어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '인도네시아어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '인도네시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '말레이어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '말레이어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '태국어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '태국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '필리핀어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '필리핀어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '싱할라어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '싱할라어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '크메르어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '크메르어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '네팔어', 'phone', '안산시 공식 안내의 전화 상담 언어: 한국어·영어·중국어·베트남어·몽골어·인도네시아어·말레이어·러시아어·우즈베크어·태국어·필리핀어·싱할라어(스리랑카)·크메르어(캄보디아)·네팔어. 방문상담 언어별 근무일·예약 조건은 1644-7111에 문의.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident' AND s.service_code = 'guide-insurance'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '네팔어' AND l.consultation_method = 'phone');
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'ansan-foreign-resident'
  AND s.service_code = 'guide-insurance'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) AND x.consultation_method = 'visit'
  );

-- 1372 소비자상담·한국소비자원
-- 출처: https://www.kca.go.kr/odr/pg/ma/cnsutInfo1.do
-- https://www.kca.go.kr/odr/cm/cm/faq.do
-- https://www.kca.go.kr/kca/sub.do?code1=54&menukey=5355
INSERT INTO support_institutions (
    institution_code, institution_name, institution_type, address, phone, opening_hours, website_url, is_example, source_url, as_of, checked_at, description, target_description, additional_notes, search_aliases, featured_keywords, additional_phones, additional_source_urls, verified_fields, verification_status, guidance_data
) VALUES (
    'kca-1372',
    '1372 소비자상담·한국소비자원',
    'public',
    '서울특별시 송파구 송파대로 167 문정테라타워 A동 15층 한국소비자원 서울강원지원 방문상담실',
    '1372',
    '평일 09:00~18:00(12:00~13:00 제외, 통화요금 발신자 부담)',
    'https://www.kca.go.kr/odr/pg/ma/cnsutInfo1.do',
    0,
    'https://www.kca.go.kr/odr/pg/ma/cnsutInfo1.do',
    '2026-10-26',
    '2026-10-26 00:00:00',
    '상품·서비스 이용 과정의 소비자분쟁 상담과 피해구제 절차 안내',
    '상품·서비스의 구매·이용과 관련해 소비자 상담이나 피해구제 절차 안내가 필요한 이용자. 사건별 접수 대상 여부는 상담에서 확인.',
    '1372는 전국 소비자상담 통합창구이며 한국소비자원만의 단독 콜센터가 아닙니다. 한국소비자원의 피해구제와 방문 접수는 해당 절차를 확인해 이용하세요.',
    JSON_ARRAY('1372 소비자상담·한국소비자원', '1372', '소비자분쟁', '소비자상담', '계약해지', '환불'),
    JSON_ARRAY('소비자분쟁', '소비자상담', '계약해지', '환불'),
    JSON_ARRAY(),
    JSON_ARRAY('https://www.kca.go.kr/odr/cm/cm/faq.do', 'https://www.kca.go.kr/kca/sub.do?code1=54&menukey=5355'),
    JSON_ARRAY('name', 'phone', 'visitAddress', 'scopeNotes', 'sourceUrls'),
    'partial',
    JSON_OBJECT('detail', JSON_OBJECT('기관위치_전화지역', '서울특별시 송파구 송파대로 167 문정테라타워 A동 15층 한국소비자원 서울강원지원 방문상담실', '상담방식', '전화, 방문, 인터넷상담', '방문예약필수여부', '자동차·금융·보험·의료 등 전문분야 방문은 공유누리 사전 예약 필수. 다른 품목도 방문 전 예약·상담 가능 여부 확인 권장.', '전화지원언어', '현행 지원언어 목록 확인 필요', '방문지원언어', '방문 상담언어는 사전 문의 필요', '주말전화', '전화상담 미운영', '공휴일전화', '전화상담 미운영', '주말방문', '현행 방문일정은 예약화면·전화로 확인', '공휴일방문', '공휴일 방문 가능 여부는 사전 문의 필요'))
);
INSERT INTO institution_services (institution_id, service_code, topic_code, service_name, summary, description, target_description, guidance_role, phone_available, phone, phone_hours, phone_weekend_available, phone_holiday_available, phone_region_status, visit_available, visit_address, opening_hours, visit_weekend_available, visit_holiday_available, reservation_available, visit_reservation_required, visit_region_status, branch_information, language_status, region_status, language_notes, contact_description, online_available, online_url, source_url, as_of, checked_at, display_order)
SELECT i.institution_id, 'guide-administration',
    NULL,
    '소비자분쟁 상담과 한국소비자원 피해구제 절차 안내',
    '소비자분쟁 상담과 한국소비자원 피해구제 절차 안내',
    CONCAT('상품·서비스 거래에서 발생한 계약·환불 등 소비자분쟁을 상담하고 피해구제 신청 절차를 안내합니다.', CHAR(10), '소비자상담과 피해구제 접수·분쟁조정은 단계가 다릅니다. 상담을 받았다는 사실만으로 환불이나 배상이 확정되지는 않습니다.', CHAR(10), '자동차·금융·보험·의료 등 전문분야 방문상담은 공식 안내에 따라 사전 예약해야 합니다. 일반 품목도 예약 없이 방문하면 상담이 지연되거나 어려울 수 있습니다.'),
    '상품·서비스의 구매·이용과 관련해 소비자 상담이나 피해구제 절차 안내가 필요한 이용자. 사건별 접수 대상 여부는 상담에서 확인.',
    'direct',
    1,
    '1372',
    '평일 09:00~18:00(12:00~13:00 제외, 통화요금 발신자 부담)',
    0,
    0,
    'unrestricted',
    1,
    '서울특별시 송파구 송파대로 167 문정테라타워 A동 15층 한국소비자원 서울강원지원 방문상담실',
    '방문 장소는 확인. 방문상담실의 현행 운영시간은 예약화면·1372에서 별도 확인.',
    NULL,
    NULL,
    1,
    NULL,
    'published',
    '한국소비자원 서울강원지원 방문상담실(송파대로 167, A동 15층). 충북 본원 주소를 일반 방문상담 장소로 안내하지 않습니다.',
    'unknown',
    'published',
    '과거 외국인 전용상담·통역연계 안내는 있으나 현행 언어별 연결번호·시간을 확인하지 못했습니다. 1372 전체의 외국어 지원으로 표시하지 않습니다.',
    '전화상담 1372. 한국소비자원 피해구제는 소비자상담 후 정해진 접수 절차를 확인하세요.',
    1,
    'https://www.ccn.go.kr/',
    'https://www.kca.go.kr/odr/pg/ma/cnsutInfo1.do',
    '2026-10-26',
    '2026-10-26 00:00:00',
    1
FROM support_institutions i WHERE i.institution_code = 'kca-1372';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '소비자분쟁' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'kca-1372' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '소비자상담' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'kca-1372' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '계약해지' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'kca-1372' AND s.service_code = 'guide-administration';
INSERT INTO institution_service_keywords (service_id, keyword_code)
SELECT s.service_id, '환불' FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'kca-1372' AND s.service_code = 'guide-administration';
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '송파구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'kca-1372'
  AND s.service_code = 'guide-administration'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '송파구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '서울특별시' AND r.region_name = '송파구'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '서울특별시')) AND x.consultation_method = 'visit'
  );

COMMIT;
