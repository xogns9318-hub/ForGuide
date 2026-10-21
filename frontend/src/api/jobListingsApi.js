const EPS_REGION_GUIDE_URL = "https://www.eps.go.kr/eo/main.eo?langCD=kr";

// 지역별 카드에 공통으로 쓰는 공식 고용복지+센터 정보입니다.
// 실제 외부 사이트 연결과 상세 모달 구현 때 sourceUrl, verifiedAt을 함께 사용합니다.
function createEmploymentCenterListing({ region, centerName, centerUrl }) {
    return {
        id: `${region}-employment-center`,
        icon: "building",
        title: `${centerName}`,
        summary: `${region} 지역의 구직·취업 지원과 고용 관련 상담 정보를 확인할 수 있습니다.`,
        language: "센터별 확인 필요",
        target: `${region} 지역 구직자`,
        information: "채용 정보 · 취업 지원 · 고용 상담",
        siteUrl: centerUrl,
        sourceUrl: EPS_REGION_GUIDE_URL,
        verifiedAt: "2026-10-21",
        region,
    };
}

function createEpsRegionalListing(region) {
    return {
        id: `${region}-eps-guide`,
        icon: "people",
        title: "고용허가제(EPS) 지역 안내",
        summary: `${region} 지역 외국인근로자의 고용 절차와 관할 고용센터 정보를 확인할 수 있습니다.`,
        language: "모국어 서비스 제공 · 방문 상담 언어는 센터별 확인",
        target: "외국인근로자(E-9 · H-2) · 고용 사업주",
        information: "고용 절차 · 민원 서비스 · 관할 센터 안내",
        siteUrl: EPS_REGION_GUIDE_URL,
        sourceUrl: EPS_REGION_GUIDE_URL,
        verifiedAt: "2026-10-21",
        region,
    };
}

const REGIONAL_LISTINGS_BY_REGION = {
    서울: [
        { id: "seoul-student-center", icon: "location", title: "서울글로벌유학생지원센터", summary: "서울의 외국인 유학생을 위한 취업 준비와 상담을 지원합니다.", language: "일부 프로그램: 한국어 · 영어 · 중국어 / 프로그램별 확인", target: "서울 거주 외국인 유학생", information: "이력서 컨설팅 · 취업 교육 · 진로 상담", siteUrl: "https://global.seoul.go.kr/hmpg/finf/empl/prog/contPageDetail.do?conts_no=443920C8D70C46A4A616445B7AEEFADD", sourceUrl: "https://global.seoul.go.kr/web/news/news/bordContDetail.do?brd_no=2&lang=EN&mode=W&post_no=51345583F90E011AE063C0A8A0237B91", verifiedAt: "2026-10-21", region: "서울" },
        { id: "seoul-counseling", icon: "message", title: "서울 외국인 주민 취업 상담", summary: "서울 거주 외국인을 위한 취업·노무 상담과 지역 정보를 안내합니다.", language: "공식 사이트에서 확인", target: "서울 거주 외국인 주민", information: "취업 상담 · 노무 상담", siteUrl: "https://global.seoul.go.kr/hmpg/finf/empl/prog/contPageDetail.do?conts_no=443920C8D70C46A4A616445B7AEEFADD", sourceUrl: "https://global.seoul.go.kr/hmpg/finf/empl/prog/contPageDetail.do?conts_no=443920C8D70C46A4A616445B7AEEFADD", verifiedAt: "2026-10-21", region: "서울" },
    ],
    경기: [
        createEmploymentCenterListing({ region: "경기", centerName: "수원고용복지+센터", centerUrl: "https://www.work.go.kr/suwon/main.do" }),
        createEpsRegionalListing("경기"),
    ],
    인천: [
        createEmploymentCenterListing({ region: "인천", centerName: "인천고용복지+센터", centerUrl: "https://www.work.go.kr/incheon/main.do" }),
        createEpsRegionalListing("인천"),
    ],
    부산: [
        { id: "busan-worker-center", icon: "location", title: "부산외국인근로자지원센터", summary: "부산 외국인근로자의 고용·법률·생활 상담과 초기 정착을 지원합니다.", language: "다국어 상담·통역 20개국 언어 지원", target: "부산 지역 외국인근로자", information: "고용 · 법률 · 생활 상담", siteUrl: "https://www.busan.go.kr/depart/family0407", sourceUrl: "https://www.busan.go.kr/depart/family0407", verifiedAt: "2026-10-21", region: "부산" },
        { id: "busan-resident-center", icon: "message", title: "부산외국인주민지원센터", summary: "부산 거주 외국인 주민을 위한 생활·체류·노동 상담 정보를 제공합니다.", language: "한국어 · 영어 · 중국어 · 베트남어 · 미얀마어 · 힌디어", target: "부산 거주 외국인 주민", information: "노동 · 산재 · 의료 · 체류 상담", siteUrl: "https://www.busan.go.kr/depart/family0407", sourceUrl: "https://www.busan.go.kr/depart/family0407", verifiedAt: "2026-10-21", region: "부산" },
    ],
    대구: [
        createEmploymentCenterListing({ region: "대구", centerName: "대구고용복지+센터", centerUrl: "https://www.work.go.kr/daegu/main.do" }),
        createEpsRegionalListing("대구"),
    ],
    광주: [
        createEmploymentCenterListing({ region: "광주", centerName: "광주고용복지+센터", centerUrl: "https://www.work.go.kr/gwangju/main.do" }),
        createEpsRegionalListing("광주"),
    ],
    대전: [
        createEmploymentCenterListing({ region: "대전", centerName: "대전고용복지+센터", centerUrl: "https://www.work.go.kr/daejeon/main.do" }),
        createEpsRegionalListing("대전"),
    ],
    울산: [
        createEmploymentCenterListing({ region: "울산", centerName: "울산고용복지+센터", centerUrl: "https://www.work.go.kr/ulsan/main.do" }),
        createEpsRegionalListing("울산"),
    ],
    세종: [
        createEmploymentCenterListing({ region: "세종", centerName: "세종고용복지+센터", centerUrl: "https://www.work.go.kr/sejong/main.do" }),
        createEpsRegionalListing("세종"),
    ],
    강원: [
        createEmploymentCenterListing({ region: "강원", centerName: "춘천고용복지+센터", centerUrl: "https://www.work.go.kr/chuncheon/main.do" }),
        createEpsRegionalListing("강원"),
    ],
    충북: [
        createEmploymentCenterListing({ region: "충북", centerName: "청주고용복지+센터", centerUrl: "https://www.work.go.kr/cheongju/main.do" }),
        createEpsRegionalListing("충북"),
    ],
    충남: [
        createEmploymentCenterListing({ region: "충남", centerName: "천안고용복지+센터", centerUrl: "https://www.work.go.kr/cheonan/main.do" }),
        createEpsRegionalListing("충남"),
    ],
    전북: [
        createEmploymentCenterListing({ region: "전북", centerName: "전주고용복지+센터", centerUrl: "https://www.work.go.kr/jeonju/main.do" }),
        createEpsRegionalListing("전북"),
    ],
    전남: [
        createEmploymentCenterListing({ region: "전남", centerName: "목포고용복지+센터", centerUrl: "https://www.work.go.kr/mokpo/main.do" }),
        createEpsRegionalListing("전남"),
    ],
    경북: [
        createEmploymentCenterListing({ region: "경북", centerName: "포항고용복지+센터", centerUrl: "https://www.work.go.kr/pohang/main.do" }),
        createEpsRegionalListing("경북"),
    ],
    경남: [
        createEmploymentCenterListing({ region: "경남", centerName: "창원고용복지+센터", centerUrl: "https://www.work.go.kr/changwon/main.do" }),
        createEpsRegionalListing("경남"),
    ],
    제주: [
        createEmploymentCenterListing({ region: "제주", centerName: "제주특별자치도고용복지+센터", centerUrl: "https://www.work.go.kr/jeju/main.do" }),
        createEpsRegionalListing("제주"),
    ],
};

const JOB_LISTING_SECTIONS = [
    {
        id: "public",
        title: "외국인 공공 취업 지원",
        description: "외국인을 위한 공공 취업 지원 서비스와 관련 기관을 모아봤습니다.",
        listings: [
            { id: "work24", icon: "building", title: "외국인 공공 고용 서비스", summary: "공공 구직 정보와 취업 지원 서비스를 확인할 수 있습니다.", language: "공식 사이트에서 확인", target: "한국 거주 외국인", information: "구직 정보 · 취업 지원 안내", siteUrl: "https://www.work24.go.kr/" },
            { id: "eps", icon: "people", title: "외국인 고용 지원 안내", summary: "외국인근로자 고용 절차와 체류 지원 정보를 안내합니다.", language: "공식 사이트에서 확인", target: "외국인근로자 · 고용 사업주", information: "고용 절차 · 체류 지원 안내", siteUrl: "https://eps.hrdkorea.or.kr/e9/user/employment/employment.do?method=employProcessLabor" },
        ],
    },
    {
        id: "worker",
        title: "외국인 근로자 채용 정보",
        description: "외국인 근로자를 위한 채용 정보와 기업 연결 서비스를 안내합니다.",
        listings: [
            { id: "kowork", icon: "briefcase", title: "외국인 전용 채용 플랫폼", summary: "외국인 구직자를 위한 다양한 채용 공고를 살펴볼 수 있습니다.", language: "공식 사이트에서 확인", target: "한국 취업을 희망하는 외국인", information: "채용 공고 · 기업 정보", siteUrl: "https://www.kowork.kr/" },
            { id: "kwork", icon: "connection", title: "외국인 인재 채용 매칭", summary: "외국인 유학생과 국내 기업을 연결하는 취업 매칭 정보를 제공합니다.", language: "공식 사이트에서 확인", target: "외국인 유학생 · 기업", information: "채용 매칭 · 기업 상담", siteUrl: "https://k-work.or.kr/main/main.do" },
        ],
    },
    {
        id: "student",
        title: "외국인 유학생 취업 지원",
        description: "한국에서 공부하는 외국인 유학생을 위한 취업 지원 정보를 모았습니다.",
        listings: [
            { id: "study-prep", icon: "graduation", title: "유학생 취업 지원 포털", summary: "한국 취업 준비에 필요한 정보와 지원 제도를 확인할 수 있습니다.", language: "공식 사이트에서 확인", target: "국내 외국인 유학생", information: "취업 준비 · 진로 정보", siteUrl: "https://cdn.studyinkorea.go.kr/in/work/aboutKoreaEmployment.do?tab=job-prep" },
            { id: "study-jobs", icon: "document", title: "유학생 인턴십·취업 정보", summary: "외국인 유학생을 위한 인턴십과 취업 관련 정보를 안내합니다.", language: "공식 사이트에서 확인", target: "국내 외국인 유학생", information: "인턴십 · 채용 정보", siteUrl: "https://was3.studyinkorea.go.kr/ko/work/workInfo.do" },
        ],
    },
    {
        id: "regional",
        title: "지역 외국인 취업·상담 지원",
        description: "지역별로 운영되는 외국인 취업 지원 센터와 상담 기관을 안내합니다.",
        regionOptions: Object.keys(REGIONAL_LISTINGS_BY_REGION),
        // 지역 필터 구현 전에는 서울 카드만 기본으로 노출합니다.
        listings: REGIONAL_LISTINGS_BY_REGION.서울,
        // 지역 선택 기능에서 selectedRegion 값으로 꺼내 쓸 전체 지역 카드 데이터입니다.
        listingsByRegion: REGIONAL_LISTINGS_BY_REGION,
    },
];

// MOCK: 실제 기관 목록 API가 준비되기 전 화면 확인을 위한 지연 응답
function waitForMockResponse() {
    return new Promise((resolve) => {
        setTimeout(resolve, 450);
    });
}

// MOCK: 일자리 목록 화면에 표시할 기관 구역과 카드 목록을 조회한다.
export async function getJobListingSections() {
    await waitForMockResponse();

    return JOB_LISTING_SECTIONS;
}
