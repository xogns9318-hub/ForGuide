-- V19: 기관별 상담 업무와 실제 검색 키워드를 연결한다.
-- 각 행은 [기관 코드, 분야 코드, 역할, 설명, 키워드 목록] 순서다.

-- direct는 해당 문제의 상담을 제공하는 업무다.
-- related는 관련 민원·담당기관 안내에 해당하는 업무다.
-- direct도 금융상품 승인이나 지원금 지급을 보장한다는 뜻은 아니다.

-- 금융 분야에 속하지 않는 행정 안내는 분야를 NULL로 둔다.
-- 키워드는 현재 선택 목록과 같은 한국어 문자열을 식별값으로 사용한다.

-- JSON은 이 파일 안에서 등록 자료를 전달하기 위한 임시 변수다.
-- 실제 업무와 키워드는 아래 INSERT로 각각 관계형 테이블에 저장한다.
SET @fg_v19_services = '[
  ["immigration-1345",null,"direct","출입국·체류 민원 안내",["외국인등록","체류기간 연장","체류자격 변경","출입국","비자","기관 안내"]],
  ["danuri","living","related","해당 이용 대상의 생활·취업 정보와 관련 기관 연계",["생활비","생활비 부족"]],
  ["danuri","employment","related","해당 이용 대상의 생활·취업 정보와 관련 기관 연계",["취업","취업지원"]],
  ["danuri","financial_support","related","해당 이용 대상의 생활·취업 정보와 관련 기관 연계",["생활비 지원","복지지원"]],
  ["danuri",null,"related","생활통역 및 관련 기관 안내",["생활정보","생활통역","법률상담","기관 안내"]],
  ["foreign-worker","wages","direct","외국인근로자의 고용·노동 고충 상담",["급여","월급","임금","임금 체불","급여 미지급"]],
  ["foreign-worker","employment_contract","direct","외국인근로자의 고용·노동 고충 상담",["근로계약","근로계약서","근무시간","근무조건"]],
  ["foreign-worker","retirement","direct","외국인근로자의 고용·노동 고충 상담",["퇴직","퇴사","퇴직금","퇴직금 미지급"]],
  ["foreign-worker","employment","direct","외국인근로자의 고용·노동 고충 상담",["취업","사업장 변경","고용허가제"]],
  ["labor-1350","wages","direct","고용·노동 관련 제도 상담",["급여","월급","임금","임금 체불","급여 미지급","최저임금","급여명세서","시급","일당","주급","상여금"]],
  ["labor-1350","employment_contract","direct","고용·노동 관련 제도 상담",["근로계약","근로계약서","계약기간","근무시간","근무조건","초과근무","연장근로","야간근로","휴일근로","휴게시간","연차","주휴수당"]],
  ["labor-1350","retirement","direct","고용·노동 관련 제도 상담",["퇴직","퇴사","퇴직금","퇴직금 미지급","퇴직금 계산","퇴직금 지급일","해고","부당해고","계약 종료"]],
  ["labor-1350","employment","direct","고용·노동 관련 제도 상담",["취업","구직","취업지원"]],
  ["labor-1350","insurance","direct","고용·노동 관련 제도 상담",["실업급여"]],
  ["fss","fraud","direct","금융사기·불법사금융 피해 상담 및 신고 안내",["보이스피싱","스미싱","금융사기","계좌 도용","명의 도용","카드 도용","대출 사기","불법대출","사기 송금","피해 신고"]],
  ["fss","bank","related","은행 관련 민원·분쟁 안내: 실제 계좌 업무는 거래은행에서 처리",["계좌 개설","통장 개설","급여통장","계좌 이용","계좌 해지","계좌 정지","거래 제한","인터넷뱅킹","모바일뱅킹","체크카드","현금카드","ATM","비밀번호","본인인증"]],
  ["fss","loan","related","대출 관련 금융 민원·분쟁: 신청·심사는 금융회사에서 처리",["생활비 대출","신용대출","전세대출","주택담보대출","소액대출","학자금대출","대출 신청","대출 자격","대출 한도","대출 금리","대출 거절","추가 대출"]],
  ["fss","repayment","related","상환·신용정보 관련 금융회사 민원 안내",["대출 상환","중도상환","연체이자","이자"]],
  ["fss","credit","related","상환·신용정보 관련 금융회사 민원 안내",["신용점수","신용조회","신용관리","금융거래 기록"]],
  ["fss","remittance","related","송금 관련 금융회사 민원: 실제 이체·오류 처리는 거래은행에 먼저 문의",["송금","계좌이체","해외송금","국내송금","송금 수수료","송금 한도","송금 오류","입금","출금","자동이체","해외 계좌"]],
  ["fss","payment","related","카드회사 관련 민원·분쟁: 발급·승인·취소는 카드회사에서 처리",["신용카드","체크카드","카드 발급","카드 결제","결제 오류","결제 취소","할부","카드대금","카드 연체","현금서비스"]],
  ["fss","insurance","related","민영보험 관련 금융 민원·분쟁 안내",["보험 가입","자동차 보험"]],
  ["fss","financial_information","related","금융정보·금융소비자 민원 안내",["금융상품","은행 이용","금리","이자","원금","수수료","금융용어","금융기관","금융상품 비교"]],
  ["nhis","insurance","direct","4대 보험 중 건강보험 관련 업무",["건강보험","보험료","보험 가입","4대 보험","건강보험 자격","건강보험 자격득실확인서","건강보험료 납부확인서","증명서 발급"]],
  ["nps","insurance","direct","4대 보험 중 국민연금 관련 업무",["국민연금","보험료","보험 가입","4대 보험","반환일시금","국민연금 가입증명","증명서 발급"]],
  ["comwel","insurance","direct","고용·산재보험 관련 담당 업무 안내",["산재보험","고용보험","산재","보험료","보험 가입","4대 보험"]],
  ["gov24",null,"related","정부24 사이트의 민원 신청·발급 이용방법 안내",["증명서 발급","외국인등록","외국인등록 사실증명","본인인증","민원 신청"]],
  ["gov110","living","related","정부 지원제도와 담당기관 안내",["생활비","긴급생활비","생활비 부족"]],
  ["gov110","housing","related","정부 지원제도와 담당기관 안내",["주거비 지원"]],
  ["gov110","financial_support","related","정부 지원제도와 담당기관 안내",["생활비 지원","주거지원금","복지지원","금융지원"]],
  ["gov110",null,"related","정부 민원 담당기관 안내",["정부민원","기관 안내","민원 신청","취업지원"]],
  ["nts","tax","direct","국세와 홈택스 관련 상담",["소득세","근로소득세","세금 납부","세금 환급","연말정산","종합소득세","원천징수","세금 체납","국세 환급","홈택스","증명서 발급"]],
  ["kinfa","loan","direct","정책서민금융 상품·제도 안내",["생활비 대출","소액대출","대출 신청","대출 자격"]],
  ["kinfa","financial_support","direct","정책서민금융 상품·제도 안내",["금융지원","서민금융"]],
  ["kinfa","financial_information","direct","정책서민금융 상품·제도 안내",["금융상품","금융기관"]],
  ["ccrs","repayment","direct","채무조정·상환계획과 신용회복 제도 상담",["채무","채무 상환","대출 상환","연체","상환기간","분할상환","채무조정","신용회복"]],
  ["ccrs","credit","direct","채무조정·상환계획과 신용회복 제도 상담",["연체 기록","신용회복","신용관리"]],
  ["ccrs","financial_support","direct","채무조정·상환계획과 신용회복 제도 상담",["채무조정 지원"]],
  ["klac","housing","direct","임대차·보증금 및 개인회생 등 법률상담",["월세","전세","보증금","보증금 반환","임대차"]],
  ["klac","repayment","direct","임대차·보증금 및 개인회생 등 법률상담",["개인회생","채무"]],
  ["klac","retirement","related","관련 분쟁의 법률상담·법률구조 안내",["퇴직금 미지급","부당해고"]],
  ["klac","fraud","related","관련 분쟁의 법률상담·법률구조 안내",["금융사기","불법대출","대출 사기","피해 신고"]],
  ["klac",null,"direct","민사·형사·행정 등 법률상담",["법률상담"]],
  ["welfare-129","living","direct","복지제도·긴급복지지원 관련 상담과 담당기관 안내",["생활비","생활비 부족","긴급생활비","의료비"]],
  ["welfare-129","housing","direct","복지제도·긴급복지지원 관련 상담과 담당기관 안내",["주거비 지원"]],
  ["welfare-129","financial_support","direct","복지제도·긴급복지지원 관련 상담과 담당기관 안내",["긴급생계지원","생활비 지원","복지지원","주거지원금"]]
]';

-- 기관 ID는 기존 고정 코드로 찾고 상담 업무 ID는 DB에서 생성한다.
-- LEFT JOIN으로 기관이 누락됐을 때 조용히 건너뛰지 않게 한다.
-- 누락된 기관의 필수 institution_id가 NULL이면 등록이 실패한다.
-- 서비스 코드는 기관 안에서 분야별로 고정한다.
INSERT INTO institution_services (
    institution_id,
    service_code,
    topic_code,
    service_name,
    summary,
    guidance_role,
    phone_available,
    phone,
    source_url,
    display_order
)
SELECT
    i.institution_id,
    CONCAT('guide-', COALESCE(d.topic_code, 'administration')),
    d.topic_code,
    d.summary,
    d.summary,
    d.guidance_role,
    1,
    i.phone,
    i.source_url,
    d.row_no
FROM JSON_TABLE(
    @fg_v19_services, '$[*]'
    COLUMNS (
        row_no FOR ORDINALITY,
        institution_code VARCHAR(80) PATH '$[0]' ERROR ON EMPTY ERROR ON ERROR,
        topic_code VARCHAR(50) PATH '$[1]' ERROR ON EMPTY ERROR ON ERROR,
        guidance_role VARCHAR(20) PATH '$[2]' ERROR ON EMPTY ERROR ON ERROR,
        summary VARCHAR(150) PATH '$[3]' ERROR ON EMPTY ERROR ON ERROR
    )
) AS d
LEFT JOIN support_institutions AS i
    ON i.institution_code = d.institution_code;

-- 실제 상담 업무에 해당하는 키워드만 연결한다.
-- 한 분야의 모든 선택 키워드를 기관 전체에 자동 부여하지 않는다.
-- 앞에서 만든 서비스 코드로 연결하므로 숫자 서비스 ID를 가정하지 않는다.
INSERT INTO institution_service_keywords (
    service_id,
    keyword_code
)
SELECT
    s.service_id,
    d.keyword_code
FROM JSON_TABLE(
    @fg_v19_services, '$[*]'
    COLUMNS (
        institution_code VARCHAR(80) PATH '$[0]' ERROR ON EMPTY ERROR ON ERROR,
        topic_code VARCHAR(50) PATH '$[1]' ERROR ON EMPTY ERROR ON ERROR,
        NESTED PATH '$[4][*]' COLUMNS (
            keyword_code VARCHAR(80) PATH '$' ERROR ON EMPTY ERROR ON ERROR
        )
    )
) AS d
JOIN support_institutions AS i
    ON i.institution_code = d.institution_code
JOIN institution_services AS s
    ON s.institution_id = i.institution_id
   AND s.service_code = CONCAT(
       'guide-',
       COALESCE(d.topic_code, 'administration')
   );

-- 임시 등록 자료는 연결이 끝나기 전에 비운다.
SET @fg_v19_services = NULL;