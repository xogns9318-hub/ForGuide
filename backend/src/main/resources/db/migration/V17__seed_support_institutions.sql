-- 실제 기관 15곳의 기본 정보를 등록한다.
-- 기관 번호는 DB에서 생성하므로 숫자 ID를 직접 지정하지 않는다.
-- 후속 상담 업무 연결에는 기관명이 아닌 institution_code를 사용한다.

-- featured_keywords는 카드에 보여줄 대표 태그다.
-- 실제 상담 분야·검색 키워드 연결은 별도 테이블에서 관리한다.

-- 운영시간·방문 장소·지원 언어·상담 지역은 여기서 추측하지 않는다.
-- 등록 날짜를 자료 확인일로 사용하지 않아 checked_at은 비워 둔다.

-- is_example = 0은 실제 기관이라는 의미다.
-- 모든 정보가 확인됐다는 뜻은 아니므로 검증 상태는 partial로 기록한다.

-- 중복 데이터를 덮어쓰거나 무시하지 않는다.
-- 이미 같은 institution_code가 있으면 UNIQUE 제약으로 확인한다.
INSERT INTO support_institutions (
    institution_code,
    institution_name,
    phone,
    website_url,
    description,
    additional_notes,
    search_aliases,
    featured_keywords,
    source_url,
    additional_source_urls,
    is_example,
    verification_status
)
VALUES
    -- 1. 외국인종합안내센터
    -- 전화 안내센터와 실제 출입국 방문 관서는 구분한다.
    (
        'immigration-1345', '외국인종합안내센터', '1345',
        'https://immigration.go.kr/moj/196/subview.do',
        '출입국·체류 민원과 국내 생활에 필요한 행정정보를 전화로 안내합니다.',
        '실제 방문 업무는 관할 출입국·외국인관서에서 처리합니다.',
        JSON_ARRAY('1345', 'Hi Korea', '하이코리아'),
        JSON_ARRAY('외국인등록', '체류기간 연장', '체류자격 변경', '출입국'),
        'https://immigration.go.kr/moj/196/subview.do',
        JSON_ARRAY(
            'https://www.immigration.go.kr/sites/immigration/file/ebook/gongzone/2025/2025_gongzone_vol74.pdf'
        ),
        0, 'partial'
    ),

    -- 2. 다누리콜센터
    -- 서비스별 이용 대상과 실제 상담 장소는 추가로 확인한다.
    (
        'danuri', '다누리콜센터', '1577-1366',
        'https://www.liveinkorea.kr/web/lay1/S1T40C44/contents.do',
        '이주여성과 다문화가족의 생활정보·통역·관련 기관 연계를 제공합니다.',
        '상담원이 찾아가는 방문과 센터에 직접 가는 내방은 구분해 예약하세요.',
        JSON_ARRAY(),
        JSON_ARRAY('생활정보', '취업지원', '복지지원', '생활통역'),
        'https://www.liveinkorea.kr/web/lay1/S1T40C44/contents.do',
        JSON_ARRAY(),
        0, 'partial'
    ),

    -- 3. 외국인력상담센터
    -- 외국인근로자와 고용사업주의 고충 상담 기관이다.
    (
        'foreign-worker', '외국인력상담센터', '1577-0071',
        'https://www.hrdkorea.or.kr/1/3/3/4',
        '외국인근로자와 고용사업주의 취업생활·사업장 적응 관련 고충을 상담합니다.',
        '방문 전 상담 시간과 예약 여부를 전화로 확인하세요.',
        JSON_ARRAY(),
        JSON_ARRAY('임금 체불', '근로계약', '근무조건', '취업'),
        'https://www.hrdkorea.or.kr/1/3/3/4',
        JSON_ARRAY(
            'https://eps.hrdkorea.or.kr/e9/user/intro/intro.do?method=workerCounseling'
        ),
        0, 'partial'
    ),

    -- 4. 고용노동부 고객상담센터
    -- 전화 상담과 관할 노동관서의 방문 민원을 구분한다.
    (
        'labor-1350', '고용노동부 고객상담센터', '1350',
        'https://1350.moel.go.kr/intro.do',
        '임금·퇴직금·근로시간 등 노동기준과 취업·고용 제도를 안내합니다.',
        '방문 민원은 관할 지방고용노동관서에 확인하세요.',
        JSON_ARRAY(),
        JSON_ARRAY('임금 체불', '주휴수당', '근로계약', '부당해고'),
        'https://1350.moel.go.kr/intro.do',
        JSON_ARRAY(
            'https://1350.moel.go.kr/home/hp/main/main.do'
        ),
        0, 'partial'
    ),

    -- 5. 금융감독원
    -- 금융 민원·분쟁 안내와 실제 금융거래 처리를 구분한다.
    (
        'fss', '금융감독원', '1332',
        'https://www.fss.or.kr/',
        '금융 민원·분쟁과 금융사기·불법사금융 관련 상담 창구입니다.',
        '계좌 개설·송금·대출 심사·카드 취소는 거래 금융회사에 먼저 문의하세요. 방문·외국어·현재 상담시간은 추가 확인이 필요합니다.',
        JSON_ARRAY(),
        JSON_ARRAY('금융사기', '불법대출', '카드 도용', '금융상품'),
        'https://www.fss.or.kr/',
        JSON_ARRAY(
            'https://www.fsc.go.kr/edu/news/85493?curPage=&srchCtgry=&srchKey=&srchText=',
            'https://www.fsc.go.kr/no010107/78296'
        ),
        0, 'partial'
    ),

    -- 6. 국민건강보험공단
    -- 건강보험 업무와 다른 사회보험 업무를 구분한다.
    (
        'nhis', '국민건강보험공단', '1577-1000',
        'https://www.nhis.or.kr/nhis/index.do',
        '건강보험 가입·자격·보험료와 관련 증명 업무를 안내합니다.',
        '외국인 자격 업무는 거주지·업무에 따라 관할 외국인민원센터를 이용해야 할 수 있습니다.',
        JSON_ARRAY(),
        JSON_ARRAY('건강보험', '보험료', '보험 가입', '건강보험 자격'),
        'https://www.nhis.or.kr/nhis/index.do',
        JSON_ARRAY(
            'https://www.nhis.or.kr/english/wbheaa02000m01.do',
            'https://www.nhis.or.kr/static/html/map/map_more_nhis_01.html'
        ),
        0, 'partial'
    ),

    -- 7. 국민연금공단
    -- 상담 가능 여부와 개별 급여의 신청 자격을 구분한다.
    (
        'nps', '국민연금공단', '1355',
        'https://www.nps.or.kr/main.do',
        '국민연금 가입·보험료·급여 청구와 외국인 연금 업무를 안내합니다.',
        '국민연금 가입·반환일시금 요건은 국적과 개인 조건에 따라 확인하세요.',
        JSON_ARRAY(),
        JSON_ARRAY('국민연금', '보험료', '반환일시금', '국민연금 가입증명'),
        'https://www.nps.or.kr/main.do',
        JSON_ARRAY(
            'https://ma.nps.or.kr/pbcpgdnc/mainbiz/getOHAG0058M0.do?menuId=MN24001568'
        ),
        0, 'partial'
    ),

    -- 8. 근로복지공단
    -- 현재 상담시간·언어·방문 가능 업무는 별도로 확인한다.
    (
        'comwel', '근로복지공단', '1588-0075',
        'https://www.comwel.or.kr/',
        '고용·산재보험 가입·납부와 산재 관련 업무를 안내합니다.',
        '상담시간·지원 언어·방문 가능 업무는 전화로 확인하세요.',
        JSON_ARRAY(),
        JSON_ARRAY('산재보험', '고용보험', '산재', '보험료'),
        'https://m.work24.go.kr/cm/c/d/0110/retrieveRlogCtpc.do',
        JSON_ARRAY(
            'https://1350.moel.go.kr/rtmview.do?id=1000079274'
        ),
        0, 'partial'
    ),

    -- 9. 정부24 콜센터
    -- 사이트 이용 안내와 실제 민원 심사·처리 기관을 구분한다.
    (
        'gov24', '정부24 콜센터', '1588-2188',
        'https://www.gov.kr/',
        '정부24의 민원 신청·증명 발급·로그인 등 이용방법을 안내합니다.',
        '정부24 이용방법 상담 창구입니다. 출입국·체류 심사와 개별 민원 처리는 해당 담당기관에 확인하세요.',
        JSON_ARRAY('정부 24', '정부24', '정부24 고객센터'),
        JSON_ARRAY('증명서 발급', '외국인등록', '본인인증', '민원 신청'),
        'https://www.gov.kr/',
        JSON_ARRAY(
            'https://foreigner.gov.kr/foreignerService/for_guide/kor/UserGuideForeigners_ko.pdf'
        ),
        0, 'partial'
    ),

    -- 10. 정부민원안내콜센터
    -- 제도 안내·담당기관 연결과 지원 자격 판정을 구분한다.
    (
        'gov110', '정부민원안내콜센터', '110',
        'https://www.110.go.kr/',
        '정부 민원과 공공서비스의 담당기관을 안내·연결합니다.',
        '지원 자격 판정·대출 심사·직접 은행 업무는 각 담당기관에서 처리합니다.',
        JSON_ARRAY('국민콜110', '국민콜 110', '정부민원'),
        JSON_ARRAY('정부민원', '복지지원', '취업지원', '기관 안내'),
        'https://www.110.go.kr/consult/manual.do',
        JSON_ARRAY(
            'https://www.gov.kr/',
            'https://www.110.go.kr/consult/chat.do'
        ),
        0, 'partial'
    ),

    -- 11. 국세청 국세상담센터
    -- 국세와 지방세, 일반 상담과 탈세 제보를 구분한다.
    (
        'nts', '국세청 국세상담센터', '126',
        'https://call.nts.go.kr/',
        '국세·세법과 홈택스 이용방법을 안내합니다.',
        '24시간 운영은 탈세 제보에 해당합니다. 지방세는 해당 지자체에 문의하세요. 외국어 지원은 메뉴별 범위를 추가 확인해야 합니다.',
        JSON_ARRAY('국세청', '홈택스', '국세상담'),
        JSON_ARRAY('소득세', '연말정산', '종합소득세', '원천징수'),
        'https://i.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=8104&mi=6694',
        JSON_ARRAY(
            'https://i.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7848&mi=13364',
            'https://ems.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=8104&mi=6694'
        ),
        0, 'partial'
    ),

    -- 12. 서민금융진흥원
    -- 기관 상담과 개별 금융상품의 심사·승인을 구분한다.
    (
        'kinfa', '서민금융진흥원', '1397',
        'https://www.kinfa.or.kr/counselingSupport/centerIntroduction.do',
        '정책서민금융 상품·제도와 서민금융통합지원센터를 안내합니다.',
        '상담 가능 범위와 외국인의 상품 이용 자격은 상품별 요건을 확인하세요.',
        JSON_ARRAY(),
        JSON_ARRAY('서민금융', '금융지원', '생활비 대출', '소액대출'),
        'https://www.kinfa.or.kr/counselingSupport/microfinanceCallCenter1397.do',
        JSON_ARRAY(
            'https://www.kinfa.or.kr/counselingSupport/centerIntroduction.do'
        ),
        0, 'partial'
    ),

    -- 13. 신용회복위원회
    -- 위원회의 채무조정과 법원의 개인회생 절차를 구분한다.
    (
        'ccrs', '신용회복위원회', '1600-5500',
        'https://www.ccrs.or.kr/',
        '연체채무·채무조정·상환계획과 신용회복 제도를 안내합니다.',
        '외국인의 채무조정 신청 가능 여부는 개별 확인이 필요합니다. 법원 개인회생과 위원회 채무조정을 구분하세요.',
        JSON_ARRAY(),
        JSON_ARRAY('채무조정', '연체', '신용회복', '대출 상환'),
        'https://edu.ccrs.or.kr/main.do',
        JSON_ARRAY(
            'https://job.ccrs.or.kr/cms/com/index.do?MENU_ID=2610'
        ),
        0, 'partial'
    ),

    -- 14. 대한법률구조공단
    -- 법률상담과 법률구조 지원 자격을 구분한다.
    (
        'klac', '대한법률구조공단', '132',
        'https://www.klac.or.kr/',
        '임대차·채무·근로 등 법률문제의 상담과 법률구조를 안내합니다.',
        '전화·방문 시간과 점심시간은 추가 확인이 필요합니다. 외국인 법률구조 지원 여부도 개별 요건을 확인하세요.',
        JSON_ARRAY(),
        JSON_ARRAY('보증금 반환', '개인회생', '부당해고', '법률상담'),
        'https://moj.go.kr/moj/177/subview.do',
        JSON_ARRAY(
            'https://www.klac.or.kr/'
        ),
        0, 'partial'
    ),

    -- 15. 보건복지상담센터
    -- 일반 복지 상담과 긴급 상담의 운영 범위를 구분한다.
    (
        'welfare-129', '보건복지상담센터', '129',
        'https://129.go.kr/counsel/counsel01.do',
        '보건복지 제도와 긴급복지지원 등 담당 서비스를 안내합니다.',
        '지원 자격은 제도와 개인 조건에 따라 확인해야 합니다. 일반 상담과 긴급 상담은 운영 범위가 다릅니다.',
        JSON_ARRAY(),
        JSON_ARRAY('긴급생계지원', '생활비 지원', '의료비', '복지지원'),
        'https://129.go.kr/counsel/counsel01.do',
        JSON_ARRAY(),
        0, 'partial'
    );