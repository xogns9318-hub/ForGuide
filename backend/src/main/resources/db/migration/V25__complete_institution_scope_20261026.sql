-- 기존 V23은 수정하지 않는다. 이 파일은 기존 15개 기관의 안내를 보완하는 새 DML 마이그레이션이다.
-- 공식 자료 확인 기준일: 2026-10-26. 모든 필드가 검증됐다는 의미는 아니다.
-- 임시 테이블·프로시저를 만들지 않으며 다른 언어와 기존 업무·키워드를 삭제하지 않는다.
-- 적용 전 00-적용방법.md의 사전 조회와 별도 검증 DB 실행을 수행한다.
START TRANSACTION;

-- immigration-1345
-- 출처: https://www.immigration.go.kr/immigration/1530/subview.do
-- https://www.immigration.go.kr/bbs/moj/182/608172/artclView.do
UPDATE support_institutions i
SET i.additional_notes = '평일 18:00 이후에는 한국어·영어·중국어 상담을 안내합니다. 인권침해 신고는 현재 1345 ARS 안내에 따라 연결하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'immigration-1345';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('출입국·체류, 외국인등록 등 행정절차와 국내 생활정보를 안내합니다.', CHAR(10), '외국인 인권침해 신고와 관계기관 연결을 지원합니다. 신고 접수가 체류허가나 노동사건의 처분을 뜻하지는 않습니다.', CHAR(10), '출입국 민원 신청·심사는 관할 출입국·외국인관서에서 처리합니다. 1345 전화상담과 관서 방문예약은 별개입니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('출입국·체류, 외국인등록 등 행정절차와 국내 생활정보를 안내합니다.', CHAR(10), '외국인 인권침해 신고와 관계기관 연결을 지원합니다. 신고 접수가 체류허가나 노동사건의 처분을 뜻하지는 않습니다.', CHAR(10), '출입국 민원 신청·심사는 관할 출입국·외국인관서에서 처리합니다. 1345 전화상담과 관서 방문예약은 별개입니다.')) END,
    s.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'immigration-1345'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.immigration.go.kr/immigration/1530/subview.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.immigration.go.kr/immigration/1530/subview.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.immigration.go.kr/immigration/1530/subview.do'))
WHERE i.institution_code = 'immigration-1345';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.immigration.go.kr/bbs/moj/182/608172/artclView.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.immigration.go.kr/bbs/moj/182/608172/artclView.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.immigration.go.kr/bbs/moj/182/608172/artclView.do'))
WHERE i.institution_code = 'immigration-1345';

-- danuri
-- 출처: https://www.mogef.go.kr/nw/rpd/nw_rpd_s001d.do?bbtSn=710861&mid=news405
UPDATE support_institutions i
SET i.additional_notes = '면접·방문상담은 대표전화로 상담 장소와 일정을 먼저 협의하세요. 지역센터의 일반 방문상담을 24시간 운영으로 해석하지 마세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'danuri';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('이주여성·다문화가족의 한국 생활, 가족 갈등과 폭력 피해 등을 상담하고 통역과 필요한 기관 연결을 지원합니다.', CHAR(10), '대표전화 1577-1366은 13개 언어로 365일 24시간 운영하며, 긴급지원과 일반 면접상담의 이용 방법은 다릅니다.', CHAR(10), '취업·복지·금융 관련 기관을 안내받을 수 있으나, 이곳에서 모든 지원금·대출의 신청이나 심사를 처리하는 것은 아닙니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('이주여성·다문화가족의 한국 생활, 가족 갈등과 폭력 피해 등을 상담하고 통역과 필요한 기관 연결을 지원합니다.', CHAR(10), '대표전화 1577-1366은 13개 언어로 365일 24시간 운영하며, 긴급지원과 일반 면접상담의 이용 방법은 다릅니다.', CHAR(10), '취업·복지·금융 관련 기관을 안내받을 수 있으나, 이곳에서 모든 지원금·대출의 신청이나 심사를 처리하는 것은 아닙니다.')) END,
    s.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'danuri'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.mogef.go.kr/nw/rpd/nw_rpd_s001d.do?bbtSn=710861&mid=news405' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.mogef.go.kr/nw/rpd/nw_rpd_s001d.do?bbtSn=710861&mid=news405')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.mogef.go.kr/nw/rpd/nw_rpd_s001d.do?bbtSn=710861&mid=news405'))
WHERE i.institution_code = 'danuri';

-- foreign-worker
-- 출처: https://eps.hrdkorea.or.kr/e9/user/intro/intro.do?method=workerCounseling
-- https://www.hrdkorea.or.kr/1/3/3/4
UPDATE support_institutions i
SET i.additional_notes = '지원언어는 공식 페이지 사이에 목록 차이가 있습니다. 영어·타지키스탄어 연결 가능 여부와 방문상담 언어·일정은 1577-0071에 먼저 문의하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00',
    i.guidance_data = JSON_MERGE_PATCH(COALESCE(i.guidance_data, JSON_OBJECT()), JSON_OBJECT('detail', JSON_OBJECT('기관위치_전화지역', '전화 1577-0071 / 내방: 경기 안산시 단원구 고잔2길 16 에머랄드빌딩 3층', '상담방식', '전화, 내방상담(방문 일정·언어는 사전 문의)')))
WHERE i.institution_code = 'foreign-worker';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('외국인근로자와 고용사업주의 고용허가제, 근로관계, 임금·퇴직금 등 고충을 상담합니다.', CHAR(10), '전화상담 외에 내방상담도 공식 안내되어 있습니다. 내방 장소는 경기도 안산시 단원구 고잔2길 16 에머랄드빌딩 3층입니다.', CHAR(10), '상담·통역과 사건의 정식 조사·처분은 구분됩니다. 임금체불 진정 등은 안내받은 담당기관의 절차에 따라 진행해야 합니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('외국인근로자와 고용사업주의 고용허가제, 근로관계, 임금·퇴직금 등 고충을 상담합니다.', CHAR(10), '전화상담 외에 내방상담도 공식 안내되어 있습니다. 내방 장소는 경기도 안산시 단원구 고잔2길 16 에머랄드빌딩 3층입니다.', CHAR(10), '상담·통역과 사건의 정식 조사·처분은 구분됩니다. 임금체불 진정 등은 안내받은 담당기관의 절차에 따라 진행해야 합니다.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.visit_available = 1,
    s.visit_address = '경기도 안산시 단원구 고잔2길 16 에머랄드빌딩 3층',
    s.branch_information = '한국산업인력공단 EPS 공식 페이지의 내방상담 장소. 1577-0071로 방문 가능 시간·상담언어·예약 필요 여부를 먼저 확인하세요.',
    s.visit_region_status = 'published'
WHERE i.institution_code = 'foreign-worker'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://eps.hrdkorea.or.kr/e9/user/intro/intro.do?method=workerCounseling' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://eps.hrdkorea.or.kr/e9/user/intro/intro.do?method=workerCounseling')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://eps.hrdkorea.or.kr/e9/user/intro/intro.do?method=workerCounseling'))
WHERE i.institution_code = 'foreign-worker';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.hrdkorea.or.kr/1/3/3/4' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.hrdkorea.or.kr/1/3/3/4')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.hrdkorea.or.kr/1/3/3/4'))
WHERE i.institution_code = 'foreign-worker';
-- 실제 방문 장소만 연결한다. 시·군·구 마스터가 없으면 확인된 시·도로 연결한다.
INSERT INTO institution_service_regions (service_id, region_id, consultation_method)
SELECT s.service_id, COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')), 'visit'
FROM institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'foreign-worker'
  AND s.service_code LIKE 'guide-%'
  AND COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM institution_service_regions x
    WHERE x.service_id = s.service_id AND x.region_id = COALESCE((SELECT MIN(r.region_id) FROM regions r JOIN regions p ON p.region_id = r.parent_region_id WHERE r.region_level = 'district' AND p.region_name = '경기도' AND r.region_name = '안산시'), (SELECT MIN(p.region_id) FROM regions p WHERE p.region_level = 'province' AND p.region_name = '경기도')) AND x.consultation_method = 'visit'
  );

-- labor-1350
-- 출처: https://1350.moel.go.kr/home/hp/ch/callchat.do
UPDATE support_institutions i
SET i.additional_notes = '1350의 외국어 상담 메뉴는 영어·중국어를 안내합니다. 실제 방문이 필요한 경우 담당 고용센터·노동관서를 먼저 확인하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'labor-1350';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('임금·퇴직금, 근로계약·근무조건, 고용 및 실업급여 등 고용노동 행정제도를 안내합니다.', CHAR(10), '1350 전화상담은 제도·절차에 관한 안내입니다. 개별 진정·신고·급여 신청은 담당 노동관서나 고용센터의 절차를 따라야 합니다.', CHAR(10), '야간·주말의 당직 연결과 평일의 일반 노동상담은 다릅니다. 당직 안내를 일반 노동상담의 24시간 운영으로 표시하지 않습니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('임금·퇴직금, 근로계약·근무조건, 고용 및 실업급여 등 고용노동 행정제도를 안내합니다.', CHAR(10), '1350 전화상담은 제도·절차에 관한 안내입니다. 개별 진정·신고·급여 신청은 담당 노동관서나 고용센터의 절차를 따라야 합니다.', CHAR(10), '야간·주말의 당직 연결과 평일의 일반 노동상담은 다릅니다. 당직 안내를 일반 노동상담의 24시간 운영으로 표시하지 않습니다.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.language_notes = '1350 ARS 외국어 상담 메뉴에서 영어·중국어를 안내합니다. 상담 대기와 개별 관서 방문 통역은 별도 확인이 필요합니다.'
WHERE i.institution_code = 'labor-1350'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://1350.moel.go.kr/home/hp/ch/callchat.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://1350.moel.go.kr/home/hp/ch/callchat.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://1350.moel.go.kr/home/hp/ch/callchat.do'))
WHERE i.institution_code = 'labor-1350';

-- fss
-- 출처: https://www.fss.or.kr/
UPDATE support_institutions i
SET i.additional_notes = '1332의 일반 금융민원상담, 금융자문, 불법사금융 신고 등은 업무와 운영조건을 구분해 확인하세요. 과거 외국어 통역 안내만으로 현재 제공 언어를 확정하지 않았습니다.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'fss';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('금융회사 관련 민원·분쟁과 금융소비자 피해에 관한 상담·절차 안내를 받는 창구입니다.', CHAR(10), '계좌 개설·송금·카드 승인·대출 신청과 심사는 해당 은행·카드사·금융회사에서 처리합니다. 금융감독원이 이를 대신 실행하거나 승인하지 않습니다.', CHAR(10), '건강보험·국민연금과 민영보험은 담당기관이 다릅니다. 사안에 따라 금융회사, 금융감독원 또는 다른 기관으로 연결될 수 있습니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('금융회사 관련 민원·분쟁과 금융소비자 피해에 관한 상담·절차 안내를 받는 창구입니다.', CHAR(10), '계좌 개설·송금·카드 승인·대출 신청과 심사는 해당 은행·카드사·금융회사에서 처리합니다. 금융감독원이 이를 대신 실행하거나 승인하지 않습니다.', CHAR(10), '건강보험·국민연금과 민영보험은 담당기관이 다릅니다. 사안에 따라 금융회사, 금융감독원 또는 다른 기관으로 연결될 수 있습니다.')) END,
    s.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'fss'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.fss.or.kr/' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.fss.or.kr/')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.fss.or.kr/'))
WHERE i.institution_code = 'fss';

-- nhis
-- 출처: https://www.nhis.or.kr/english/wbheaa02000m01.do
-- https://www.nhis.or.kr/english/wbheaa02100m01.do
UPDATE support_institutions i
SET i.additional_notes = '외국어 전화는 033-811-2000 또는 1577-1000 내선 6으로 안내합니다. 전화 지원 언어가 해당 방문센터에서도 항상 제공되는 것은 아닙니다.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'nhis';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('국민건강보험의 가입·자격, 보험료, 납부와 관련 증명서 등 건강보험 업무를 안내합니다.', CHAR(10), '외국인민원센터는 센터별 관할과 처리 업무가 다릅니다. 거주지·업무에 맞는 방문 장소를 먼저 확인해야 합니다.', CHAR(10), '민영보험의 계약·보험금 분쟁이나 국민연금·고용·산재보험은 각각 다른 담당기관의 업무입니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('국민건강보험의 가입·자격, 보험료, 납부와 관련 증명서 등 건강보험 업무를 안내합니다.', CHAR(10), '외국인민원센터는 센터별 관할과 처리 업무가 다릅니다. 거주지·업무에 맞는 방문 장소를 먼저 확인해야 합니다.', CHAR(10), '민영보험의 계약·보험금 분쟁이나 국민연금·고용·산재보험은 각각 다른 담당기관의 업무입니다.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.branch_information = '공식 외국인민원센터 안내: 서울(구로구 새말로 97 신도림테크노마트 업무동 3층), 안산(단원구 화랑로 366 교보빌딩 4층), 수원(팔달구 효원로 119 청궁빌딩 1층), 인천(부평구 부평대로 88 부평대로우체국 7층), 의정부(시민로 80 센트럴타워 9층). 센터별 관할·업무와 방문 예약·운영시간은 1577-1000에서 확인하세요.'
WHERE i.institution_code = 'nhis'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.nhis.or.kr/english/wbheaa02000m01.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.nhis.or.kr/english/wbheaa02000m01.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.nhis.or.kr/english/wbheaa02000m01.do'))
WHERE i.institution_code = 'nhis';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.nhis.or.kr/english/wbheaa02100m01.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.nhis.or.kr/english/wbheaa02100m01.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.nhis.or.kr/english/wbheaa02100m01.do'))
WHERE i.institution_code = 'nhis';

-- nps
-- 출처: https://www.nps.or.kr/eng/main.do
-- https://www.nps.or.kr/eng/ntnlpnssrvc/contus/getOHAI0007M0.do?menuId=MN24001385
UPDATE support_institutions i
SET i.additional_notes = '국민연금공단 영문 홈페이지에 언어별 직통번호가 공개되어 있습니다. 언어별 상담은 평일 09:00~18:00, 점심시간 제외로 안내하므로 점심시간의 정확한 연결 가능 여부는 해당 번호에 문의하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00',
    i.guidance_data = JSON_MERGE_PATCH(COALESCE(i.guidance_data, JSON_OBJECT()), JSON_OBJECT('detail', JSON_OBJECT('전화지원언어', '한국어(1355), 영어·중국어·인도네시아어·태국어·필리핀어·우즈베크어·러시아어·베트남어(언어별 직통번호; 아래 추가 연락처 참고)')))
WHERE i.institution_code = 'nps';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('국민연금의 가입·보험료, 연금 급여와 외국인 반환일시금 등 국민연금 제도를 안내합니다.', CHAR(10), '외국인의 가입과 반환일시금 등은 국적·체류자격·사회보장협정 및 개별 요건에 따라 달라집니다. 외국인이라는 이유만으로 모든 급여가 보장되는 것은 아닙니다.', CHAR(10), '외국어 상담은 언어별 직통번호를 사용합니다. 1355 대표번호와 각 언어 직통번호의 연결 방법을 혼동하지 마세요.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('국민연금의 가입·보험료, 연금 급여와 외국인 반환일시금 등 국민연금 제도를 안내합니다.', CHAR(10), '외국인의 가입과 반환일시금 등은 국적·체류자격·사회보장협정 및 개별 요건에 따라 달라집니다. 외국인이라는 이유만으로 모든 급여가 보장되는 것은 아닙니다.', CHAR(10), '외국어 상담은 언어별 직통번호를 사용합니다. 1355 대표번호와 각 언어 직통번호의 연결 방법을 혼동하지 마세요.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.language_status = 'published',
    s.language_notes = '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.',
    s.contact_description = '한국어 1355 / 외국어 상담은 기관의 추가 연락처에 있는 언어별 직통번호를 이용하세요.'
WHERE i.institution_code = 'nps'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.nps.or.kr/eng/main.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.nps.or.kr/eng/main.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.nps.or.kr/eng/main.do'))
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.nps.or.kr/eng/ntnlpnssrvc/contus/getOHAI0007M0.do?menuId=MN24001385' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.nps.or.kr/eng/ntnlpnssrvc/contus/getOHAI0007M0.do?menuId=MN24001385')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.nps.or.kr/eng/ntnlpnssrvc/contus/getOHAI0007M0.do?menuId=MN24001385'))
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '02-6960-3250', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '02-6960-3250', 'label', '영어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '02-6960-3231', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '02-6960-3231', 'label', '중국어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '02-6960-3232', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '02-6960-3232', 'label', '인도네시아어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '031-365-3089', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '031-365-3089', 'label', '인도네시아어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '02-6960-3233', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '02-6960-3233', 'label', '태국어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '031-365-3085', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '031-365-3085', 'label', '태국어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '031-365-3087', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '031-365-3087', 'label', '필리핀어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '031-365-3086', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '031-365-3086', 'label', '우즈베크어·러시아어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '02-6960-3234', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '02-6960-3234', 'label', '베트남어 상담', 'notes', '공식 영문 안내: 평일 09:00~18:00, 점심시간 제외. 1355와 별도의 직통번호.')), i.additional_phones)
WHERE i.institution_code = 'nps';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '중국어', 'phone', '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '중국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '인도네시아어', 'phone', '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '인도네시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '태국어', 'phone', '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '태국어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '필리핀어', 'phone', '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '필리핀어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '우즈베크어', 'phone', '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '우즈베크어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '러시아어', 'phone', '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '러시아어' AND l.consultation_method = 'phone');
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '베트남어', 'phone', '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '베트남어' AND l.consultation_method = 'phone');
UPDATE institution_service_languages l
JOIN institution_services s ON s.service_id = l.service_id
JOIN support_institutions i ON i.institution_id = s.institution_id
SET l.description = '1355는 대표번호입니다. 외국어는 아래 언어별 직통번호로 문의하세요. 공식 영문 안내: 평일 09:00~18:00, 점심시간 제외(정확한 점심시간은 별도 확인). 방문 통역 제공 여부는 지사별로 확인해야 합니다.'
WHERE i.institution_code = 'nps' AND s.service_code LIKE 'guide-%' AND l.consultation_method = 'phone';

-- comwel
-- 출처: https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19485
-- https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19107
UPDATE support_institutions i
SET i.additional_notes = '2026년 고용노동부 보도자료에서 베트남어 전문상담사 운영은 확인됩니다. 현재 연결 번호·상담시간은 대표번호 1588-0075에 문의하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00',
    i.guidance_data = JSON_MERGE_PATCH(COALESCE(i.guidance_data, JSON_OBJECT()), JSON_OBJECT('detail', JSON_OBJECT('전화지원언어', '한국어 대표전화. 베트남어 전문상담사 운영은 2026년 자료에서 확인되지만 현행 연결번호·시간은 1588-0075에 문의 필요')))
WHERE i.institution_code = 'comwel';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('산재보험의 업무상 재해 보상과 고용·산재보험 가입·보험료 등 근로복지공단 담당 업무를 안내합니다.', CHAR(10), '실업급여 수급 상담·신청은 고용센터 등 해당 고용노동 행정창구와 구분해서 확인해야 합니다.', CHAR(10), '외국인을 위한 다국어 챗봇·동영상·안내문 제공은 같은 언어의 전화상담이 모두 가능하다는 뜻이 아닙니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('산재보험의 업무상 재해 보상과 고용·산재보험 가입·보험료 등 근로복지공단 담당 업무를 안내합니다.', CHAR(10), '실업급여 수급 상담·신청은 고용센터 등 해당 고용노동 행정창구와 구분해서 확인해야 합니다.', CHAR(10), '외국인을 위한 다국어 챗봇·동영상·안내문 제공은 같은 언어의 전화상담이 모두 가능하다는 뜻이 아닙니다.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.language_notes = '2026년 고용노동부 보도자료에서 베트남어 전문상담사 운영을 확인했습니다. 13개 언어 챗봇은 전화상담 언어 목록이 아닙니다. 베트남어 상담 연결번호·시간은 대표번호에서 확인하세요.'
WHERE i.institution_code = 'comwel'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19485' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19485')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19485'))
WHERE i.institution_code = 'comwel';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19107' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19107')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=19107'))
WHERE i.institution_code = 'comwel';

-- gov24
-- 출처: https://plus.gov.kr/
UPDATE support_institutions i
SET i.additional_notes = '정부24 자체 콜센터는 1588-2188·02-721-0600으로 안내됩니다. 실제 방문이 필요한 민원은 해당 발급기관의 장소·준비서류를 확인하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'gov24';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('정부24의 온라인 민원 검색, 신청·발급 및 사이트 이용 방법을 안내합니다.', CHAR(10), '증명서 발급 여부와 개별 민원의 심사·처리는 각 서비스의 소관기관이 결정합니다. 모든 민원을 정부24 콜센터가 직접 처리하지는 않습니다.', CHAR(10), '온라인 이용지원 예약·원격지원과 오프라인 민원기관 방문예약은 다릅니다. 110의 24시간 운영을 정부24 자체 콜센터 운영시간으로 적용하지 않습니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('정부24의 온라인 민원 검색, 신청·발급 및 사이트 이용 방법을 안내합니다.', CHAR(10), '증명서 발급 여부와 개별 민원의 심사·처리는 각 서비스의 소관기관이 결정합니다. 모든 민원을 정부24 콜센터가 직접 처리하지는 않습니다.', CHAR(10), '온라인 이용지원 예약·원격지원과 오프라인 민원기관 방문예약은 다릅니다. 110의 24시간 운영을 정부24 자체 콜센터 운영시간으로 적용하지 않습니다.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.branch_information = '정부24의 개별 민원 페이지에서 접수·처리기관과 방문 신청 가능 여부를 확인하세요. 콜센터 사무실을 일반 방문 민원창구로 안내하지 않습니다.'
WHERE i.institution_code = 'gov24'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://plus.gov.kr/' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://plus.gov.kr/')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://plus.gov.kr/'))
WHERE i.institution_code = 'gov24';

-- gov110
-- 출처: https://www.110.go.kr/consult/manual.do
-- https://www.acrc.go.kr/menu.es?mid=a10104060200
UPDATE support_institutions i
SET i.additional_notes = '공식 이용안내는 방문상담을 국민권익위원회 종합민원상담센터로 별도 안내합니다. 방문 전 해당 센터의 장소·운영조건을 확인하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'gov110';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('정부 민원과 행정서비스의 담당기관·제도·이용절차를 안내하는 정부민원안내 창구입니다.', CHAR(10), '전화상담은 365일 24시간이지만 영상수어 등 다른 상담 방식의 운영시간은 별도입니다.', CHAR(10), '지원금 지급·대출 심사·개별 행정처분을 직접 결정하는 기관은 아닙니다. 실제 신청과 처리는 안내받은 담당기관의 절차를 따라야 합니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('정부 민원과 행정서비스의 담당기관·제도·이용절차를 안내하는 정부민원안내 창구입니다.', CHAR(10), '전화상담은 365일 24시간이지만 영상수어 등 다른 상담 방식의 운영시간은 별도입니다.', CHAR(10), '지원금 지급·대출 심사·개별 행정처분을 직접 결정하는 기관은 아닙니다. 실제 신청과 처리는 안내받은 담당기관의 절차를 따라야 합니다.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.branch_information = '110 공식 이용안내의 방문상담 항목은 국민권익위원회 종합민원상담센터를 안내합니다. 110 콜센터 사무실로 바로 방문하지 말고 실제 방문 장소와 예약·운영시간을 확인하세요.',
    s.visit_address = '방문상담은 별도 기관인 국민권익위원회 종합민원상담센터 안내를 확인하세요.'
WHERE i.institution_code = 'gov110'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.110.go.kr/consult/manual.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.110.go.kr/consult/manual.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.110.go.kr/consult/manual.do'))
WHERE i.institution_code = 'gov110';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.acrc.go.kr/menu.es?mid=a10104060200' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.acrc.go.kr/menu.es?mid=a10104060200')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.acrc.go.kr/menu.es?mid=a10104060200'))
WHERE i.institution_code = 'gov110';

-- nts
-- 출처: https://b.nts.go.kr/english/cm/cntnts/cntntsView.do?cntntsId=8328&mi=10795
-- https://www.law.go.kr/admRulLsInfoP.do?admRulId=34985&efYd=0
UPDATE support_institutions i
SET i.additional_notes = '영어 세무상담 1588-0560: 평일 09:00~18:00, 11:30~13:00 제외. 일반 대표번호 126 및 24시간 탈세제보와 구분해서 이용하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00',
    i.guidance_data = JSON_MERGE_PATCH(COALESCE(i.guidance_data, JSON_OBJECT()), JSON_OBJECT('detail', JSON_OBJECT('전화지원언어', '한국어(126), 영어(전용번호 1588-0560; 평일 09:00~18:00, 11:30~13:00 제외)')))
WHERE i.institution_code = 'nts';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('국세 관련 제도와 신고·납부·연말정산, 홈택스 이용 등을 안내합니다. 지방세는 해당 지방자치단체 등 소관기관에 문의해야 합니다.', CHAR(10), '영어 세무상담은 별도 전용번호 1588-0560을 안내합니다. 126의 모든 상담이 영어로 제공된다는 뜻은 아닙니다.', CHAR(10), '탈세제보의 24시간 접수와 일반 세무상담은 다릅니다. 신고 내용의 개별 판단·처리는 관할 세무서 등 담당기관에서 진행합니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('국세 관련 제도와 신고·납부·연말정산, 홈택스 이용 등을 안내합니다. 지방세는 해당 지방자치단체 등 소관기관에 문의해야 합니다.', CHAR(10), '영어 세무상담은 별도 전용번호 1588-0560을 안내합니다. 126의 모든 상담이 영어로 제공된다는 뜻은 아닙니다.', CHAR(10), '탈세제보의 24시간 접수와 일반 세무상담은 다릅니다. 신고 내용의 개별 판단·처리는 관할 세무서 등 담당기관에서 진행합니다.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.language_status = 'published',
    s.language_notes = '영어 세무상담은 1588-0560 전용번호입니다. 평일 09:00~18:00 중 11:30~13:00는 제외합니다. 126의 모든 메뉴가 영어 상담을 지원하는 것은 아닙니다.',
    s.contact_description = '일반 국세상담 126 / 영어 세무상담 1588-0560(평일 09:00~18:00, 11:30~13:00 제외)'
WHERE i.institution_code = 'nts'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://b.nts.go.kr/english/cm/cntnts/cntntsView.do?cntntsId=8328&mi=10795' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://b.nts.go.kr/english/cm/cntnts/cntntsView.do?cntntsId=8328&mi=10795')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://b.nts.go.kr/english/cm/cntnts/cntntsView.do?cntntsId=8328&mi=10795'))
WHERE i.institution_code = 'nts';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.law.go.kr/admRulLsInfoP.do?admRulId=34985&efYd=0' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.law.go.kr/admRulLsInfoP.do?admRulId=34985&efYd=0')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.law.go.kr/admRulLsInfoP.do?admRulId=34985&efYd=0'))
WHERE i.institution_code = 'nts';
UPDATE support_institutions i
SET i.additional_phones = IF(JSON_SEARCH(COALESCE(i.additional_phones, JSON_ARRAY()), 'one', '1588-0560', NULL, '$[*].phone') IS NULL, JSON_ARRAY_APPEND(COALESCE(i.additional_phones, JSON_ARRAY()), '$', JSON_OBJECT('phone', '1588-0560', 'label', '영어 세무상담', 'notes', '평일 09:00~18:00, 11:30~13:00 제외. 126과 별도의 전용번호.')), i.additional_phones)
WHERE i.institution_code = 'nts';
INSERT INTO institution_service_languages (service_id, language_code, consultation_method, description)
SELECT s.service_id, '영어', 'phone', '영어 세무상담은 1588-0560 전용번호입니다. 평일 09:00~18:00 중 11:30~13:00는 제외합니다. 126의 모든 메뉴가 영어 상담을 지원하는 것은 아닙니다.'
FROM institution_services s JOIN support_institutions i ON i.institution_id = s.institution_id
WHERE i.institution_code = 'nts' AND s.service_code LIKE 'guide-%'
  AND NOT EXISTS (SELECT 1 FROM institution_service_languages l WHERE l.service_id = s.service_id AND l.language_code = '영어' AND l.consultation_method = 'phone');
UPDATE institution_service_languages l
JOIN institution_services s ON s.service_id = l.service_id
JOIN support_institutions i ON i.institution_id = s.institution_id
SET l.description = '영어 세무상담은 1588-0560 전용번호입니다. 평일 09:00~18:00 중 11:30~13:00는 제외합니다. 126의 모든 메뉴가 영어 상담을 지원하는 것은 아닙니다.'
WHERE i.institution_code = 'nts' AND s.service_code LIKE 'guide-%' AND l.consultation_method = 'phone';

-- kinfa
-- 출처: https://www.kinfa.or.kr/counselingSupport/centerIntroduction.do
-- https://www.kinfa.or.kr/counselingSupport/microfinanceCallCenter1397.do
UPDATE support_institutions i
SET i.additional_notes = '전화 야간상담과 방문 운영시간은 다릅니다. 공식 센터 안내는 평일 09:00~18:00 방문과 신분증 지참을 안내하며, 18:00~20:00 전화는 일부 상담만 제공합니다.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'kinfa';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('정책서민금융의 상품·제도와 관련 상담 및 서민금융통합지원센터 이용을 안내합니다.', CHAR(10), '상담을 받을 수 있다는 사실이 대출 승인이나 지원대상 확정을 뜻하지는 않습니다. 국적·체류자격 등 개별 상품 요건과 심사 절차를 확인해야 합니다.', CHAR(10), '일반 상담과 특정 대출상품의 신청예약은 다릅니다. 불법사금융예방대출 최초 신청 등 상품별 예약 조건을 따로 확인하세요.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('정책서민금융의 상품·제도와 관련 상담 및 서민금융통합지원센터 이용을 안내합니다.', CHAR(10), '상담을 받을 수 있다는 사실이 대출 승인이나 지원대상 확정을 뜻하지는 않습니다. 국적·체류자격 등 개별 상품 요건과 심사 절차를 확인해야 합니다.', CHAR(10), '일반 상담과 특정 대출상품의 신청예약은 다릅니다. 불법사금융예방대출 최초 신청 등 상품별 예약 조건을 따로 확인하세요.')) END,
    s.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'kinfa'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.kinfa.or.kr/counselingSupport/centerIntroduction.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.kinfa.or.kr/counselingSupport/centerIntroduction.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.kinfa.or.kr/counselingSupport/centerIntroduction.do'))
WHERE i.institution_code = 'kinfa';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.kinfa.or.kr/counselingSupport/microfinanceCallCenter1397.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.kinfa.or.kr/counselingSupport/microfinanceCallCenter1397.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.kinfa.or.kr/counselingSupport/microfinanceCallCenter1397.do'))
WHERE i.institution_code = 'kinfa';

-- ccrs
-- 출처: https://edu.ccrs.or.kr/main.do
-- https://www.fsc.go.kr/no010101/87323
-- https://fsc.go.kr/fsc020301?curPage=1
UPDATE support_institutions i
SET i.additional_notes = '현재 안내에는 기존 공식번호 1600-5500을 사용하고, 1375는 개통·전환 확인이 필요한 번호로 구분합니다. 방문은 상담 가능한 지부와 일정을 먼저 예약·확인하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00',
    i.phone = '1600-5500',
    i.guidance_data = JSON_MERGE_PATCH(COALESCE(i.guidance_data, JSON_OBJECT()), JSON_OBJECT('detail', JSON_OBJECT('기관위치_전화지역', '기존 공식 안내번호 1600-5500 / 통합번호 1375는 2026-10-29 개통식 예정으로 연결·전환 여부 확인 필요'))),
    i.additional_phones = JSON_ARRAY(JSON_OBJECT('phone', '1375', 'label', '통합번호(개통·전환 확인 필요)', 'notes', '2026-10-26 확인 당시 금융위원회 공식 일정에 10월 29일 개통식 예정. 개통 완료로 단정하지 않습니다.'))
WHERE i.institution_code = 'ccrs';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('채무조정·상환계획과 신용회복 등 제도 이용을 상담합니다.', CHAR(10), '채무조정 신청·확정과 법원의 개인회생·파산은 절차와 담당기관이 다릅니다. 상담만으로 채무 감면이나 제도 이용이 보장되지 않습니다.', CHAR(10), '2026-10-26 기준 공식 일정에는 통합번호 1375 개통식이 10월 29일로 예정되어 있습니다. 기존 안내번호 1600-5500과 통합번호의 실제 전환 여부는 이용 전에 확인하세요.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('채무조정·상환계획과 신용회복 등 제도 이용을 상담합니다.', CHAR(10), '채무조정 신청·확정과 법원의 개인회생·파산은 절차와 담당기관이 다릅니다. 상담만으로 채무 감면이나 제도 이용이 보장되지 않습니다.', CHAR(10), '2026-10-26 기준 공식 일정에는 통합번호 1375 개통식이 10월 29일로 예정되어 있습니다. 기존 안내번호 1600-5500과 통합번호의 실제 전환 여부는 이용 전에 확인하세요.')) END,
    s.checked_at = '2026-10-26 00:00:00',
    s.phone = '1600-5500',
    s.contact_description = '기존 공식 안내번호 1600-5500. 1375는 금융위원회 공식 일정상 2026-10-29 개통식 예정이므로 실제 연결·전환 확인 후 이용하세요.'
WHERE i.institution_code = 'ccrs'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://edu.ccrs.or.kr/main.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://edu.ccrs.or.kr/main.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://edu.ccrs.or.kr/main.do'))
WHERE i.institution_code = 'ccrs';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.fsc.go.kr/no010101/87323' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.fsc.go.kr/no010101/87323')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.fsc.go.kr/no010101/87323'))
WHERE i.institution_code = 'ccrs';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://fsc.go.kr/fsc020301?curPage=1' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://fsc.go.kr/fsc020301?curPage=1')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://fsc.go.kr/fsc020301?curPage=1'))
WHERE i.institution_code = 'ccrs';

-- klac
-- 출처: https://klac.or.kr/legalstruct/telephoneConsultation.do
-- https://klac.or.kr/legalstruct/visitingConsultation.do
UPDATE support_institutions i
SET i.additional_notes = '전화상담은 평일 09:00~11:50·13:00~17:50, 방문은 평일 09:00~18:00 중 12:00~13:00 제외로 안내합니다. 지부별 현재 예약 가능 일정은 예약화면에서 확인하세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00',
    i.guidance_data = JSON_MERGE_PATCH(COALESCE(i.guidance_data, JSON_OBJECT()), JSON_OBJECT('detail', JSON_OBJECT('주말방문', '공식 일반 방문상담 안내는 평일 운영입니다. 특정 지부의 토요일 별도 운영은 해당 지부 확인 필요')))
WHERE i.institution_code = 'klac';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('민사·형사·행정 등 법률문제와 임대차·보증금, 개인회생 등 관련 절차를 상담합니다.', CHAR(10), '법률상담과 소송대리·법률구조 지원은 구분됩니다. 무료 소송대리 등은 사건과 지원대상 요건에 대한 별도 심사가 필요합니다.', CHAR(10), '전화 132의 상담시간과 방문·온라인·AI 서비스 운영시간은 다릅니다. 비예약 방문도 가능하지만 예약 우선으로 대기하거나 당일 상담이 어려울 수 있습니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('민사·형사·행정 등 법률문제와 임대차·보증금, 개인회생 등 관련 절차를 상담합니다.', CHAR(10), '법률상담과 소송대리·법률구조 지원은 구분됩니다. 무료 소송대리 등은 사건과 지원대상 요건에 대한 별도 심사가 필요합니다.', CHAR(10), '전화 132의 상담시간과 방문·온라인·AI 서비스 운영시간은 다릅니다. 비예약 방문도 가능하지만 예약 우선으로 대기하거나 당일 상담이 어려울 수 있습니다.')) END,
    s.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'klac'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://klac.or.kr/legalstruct/telephoneConsultation.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://klac.or.kr/legalstruct/telephoneConsultation.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://klac.or.kr/legalstruct/telephoneConsultation.do'))
WHERE i.institution_code = 'klac';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://klac.or.kr/legalstruct/visitingConsultation.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://klac.or.kr/legalstruct/visitingConsultation.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://klac.or.kr/legalstruct/visitingConsultation.do'))
WHERE i.institution_code = 'klac';

-- welfare-129
-- 출처: https://www.129.go.kr/counsel/counsel01.do
-- https://www.129.go.kr/intro/intro02.do
UPDATE support_institutions i
SET i.additional_notes = '129의 긴급상담과 실제 현장 출동·개별 복지급여 결정은 구분됩니다. 방문 신청이 필요하면 129에서 담당 지자체·기관을 먼저 안내받으세요.',
    i.verification_status = 'partial',
    i.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'welfare-129';
UPDATE institution_services s
JOIN support_institutions i ON i.institution_id = s.institution_id
SET s.description = CASE WHEN LOCATE(CONCAT('보건복지 제도와 복지서비스, 긴급복지 등 관련 상담 및 담당기관 안내를 제공합니다.', CHAR(10), '일반 상담은 평일 운영이며 긴급복지 등 공식 지정 위기상담만 24시간 운영합니다. 모든 복지상담이 야간·주말에 가능한 것은 아닙니다.', CHAR(10), '실제 지원대상 심사와 급여 지급은 지자체 등 담당기관에서 진행합니다. 외국인은 해당 제도의 국적·체류 및 개별 요건을 따로 확인해야 합니다.'), COALESCE(s.description, '')) > 0 THEN s.description ELSE CONCAT_WS(CHAR(10), NULLIF(TRIM(s.description), ''), CONCAT('보건복지 제도와 복지서비스, 긴급복지 등 관련 상담 및 담당기관 안내를 제공합니다.', CHAR(10), '일반 상담은 평일 운영이며 긴급복지 등 공식 지정 위기상담만 24시간 운영합니다. 모든 복지상담이 야간·주말에 가능한 것은 아닙니다.', CHAR(10), '실제 지원대상 심사와 급여 지급은 지자체 등 담당기관에서 진행합니다. 외국인은 해당 제도의 국적·체류 및 개별 요건을 따로 확인해야 합니다.')) END,
    s.checked_at = '2026-10-26 00:00:00'
WHERE i.institution_code = 'welfare-129'
  AND s.service_code LIKE 'guide-%';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.129.go.kr/counsel/counsel01.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.129.go.kr/counsel/counsel01.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.129.go.kr/counsel/counsel01.do'))
WHERE i.institution_code = 'welfare-129';
UPDATE support_institutions i
SET i.additional_source_urls = IF(i.source_url = 'https://www.129.go.kr/intro/intro02.do' OR JSON_CONTAINS(COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_QUOTE('https://www.129.go.kr/intro/intro02.do')), COALESCE(i.additional_source_urls, JSON_ARRAY()), JSON_ARRAY_APPEND(COALESCE(i.additional_source_urls, JSON_ARRAY()), '$', 'https://www.129.go.kr/intro/intro02.do'))
WHERE i.institution_code = 'welfare-129';

COMMIT;
