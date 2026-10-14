// 메뉴 이름과 이동 주소
export const categories = [
    {
        // 카테고리를 구분할 이름
        id: "counseling",
        // 화면에 표시할 이름
        label: "상담",
        // 메뉴 선택 시 이동할 주소
        path: "/categories/counseling",
        // 기능 또는 계산 방식의 설명
        description:
            "내 상황에 맞는 상담을 찾고, 상담에 필요한 준비와 설명을 정리하세요.",
        // 주 기능에 포함된 세부 기능 목록
        children: [
            {
                // 화면에 표시할 이름
                label: "도움 기관 안내",
                // 메뉴 선택 시 이동할 주소
                path: "/service/consultation",
                // 기능 또는 계산 방식의 설명
                description:
                    "도움이 필요한 문제를 고르고, 상황에 맞는 도움 기관을 찾아보세요.",
            },
            {
                // 화면에 표시할 이름
                label: "상담 준비 카드 만들기",
                // 메뉴 선택 시 이동할 주소
                path: "/service/preparationCard",
                // 기능 또는 계산 방식의 설명
                description:
                    "정확한 구비서류와 본인 확인 지참물(신분증 등)을 미리 확인하는 데 도움을 드립니다.",
            },
        ],
    },
    {
        // 카테고리를 구분할 이름
        id: "recommendation",
        // 화면에 표시할 이름
        label: "추천",
        // 메뉴 선택 시 이동할 주소
        path: "/categories/recommendation",
        // 기능 또는 계산 방식의 설명
        description:
            "대출·보험·계좌를 비교하고, 목적에 맞는 금융 서비스를 살펴보세요.",
        // 주 기능에 포함된 세부 기능 목록
        children: [
            {
                // 화면에 표시할 이름
                label: "대출 상품 추천",
                // 메뉴 선택 시 이동할 주소
                path: "/service/loan",
                // 기능 또는 계산 방식의 설명
                description:
                    "대출 이용 정보를 입력하고, 목적에 맞는 상품을 살펴보세요.",
            },
            {
                // 화면에 표시할 이름
                label: "보험 상품 추천",
                // 메뉴 선택 시 이동할 주소
                path: "/service/insurance",
                // 기능 또는 계산 방식의 설명
                description:
                    "기본 정보와 필요한 보장을 바탕으로 보험 상품을 살펴보세요.",
            },
            {
                // 화면에 표시할 이름
                label: "계좌 및 카드 추천",
                // 메뉴 선택 시 이동할 주소
                path: "/service/account",
                // 기능 또는 계산 방식의 설명
                description:
                    "급여 수령과 송금 등 이용 목적에 맞는 계좌와 사용 가능한 카드를 살펴보세요.",
            },
        ],
    },
    {
        // 카테고리를 구분할 이름
        id: "repayment",
        // 화면에 표시할 이름
        label: "계산 도우미",
        // 메뉴 선택 시 이동할 주소
        path: "/categories/repayment",
        // 기능 또는 계산 방식의 설명
        description:
            "월 상환액과 총이자, 상환 일정을 확인하며 자금 계획을 세워보세요.",
        // 주 기능에 포함된 세부 기능 목록
        children: [
            {
                // 화면에 표시할 이름
                label: "월 상환액 계산기",
                // 메뉴 선택 시 이동할 주소
                path: "/service/monthlyPayment",
                // 기능 또는 계산 방식의 설명
                description:
                    "대출금액과 금리, 기간을 입력하고 예상 월 상환액을 확인하세요.",
            },
            {
                // 화면에 표시할 이름
                label: "총 이자 계산기",
                // 메뉴 선택 시 이동할 주소
                path: "/service/totalInterest",
                // 기능 또는 계산 방식의 설명
                description:
                    "상환 기간 동안 발생하는 예상 총 이자와 총 상환액을 확인하세요.",
            },
        ],
    },
    {
        // 카테고리를 구분할 이름
        id: "employment",
        // 화면에 표시할 이름
        label: "취업 도우미",
        // 메뉴 선택 시 이동할 주소
        path: "/categories/employment",
        // 기능 또는 계산 방식의 설명
        description:
            "취업 준비자료와 일자리 정보를 살펴보고, 다음 단계를 준비하세요.",
        // 주 기능에 포함된 세부 기능 목록
        children: [
            {
                // 화면에 표시할 이름
                label: "일자리 목록",
                // 메뉴 선택 시 이동할 주소
                path: "/service/jobListings",
                // 기능 또는 계산 방식의 설명
                description:
                    "나에게 맞는 일자리를 살펴보세요.",
            },
            {
                // 화면에 표시할 이름
                label: "취업 준비자료",
                // 메뉴 선택 시 이동할 주소
                path: "/service/employment",
                // 기능 또는 계산 방식의 설명
                description:
                    "지원 방식에 맞는 이력서를 작성하고 저장하거나 출력하세요.",
            },
        ],
    },
    {
        // 카테고리를 구분할 이름
        id: "simulator",
        // 화면에 표시할 이름
        label: "시뮬레이터",
        // 메뉴 선택 시 이동할 주소
        path: "/service/simulator",
        // 기능 또는 계산 방식의 설명
        description:
            "상환일과 수입·지출을 달력에 정리하고 하루 지출 계획을 세워보세요.",
        // 주 기능에 포함된 세부 기능 목록
        children: [],
    },
    {
        // 카테고리를 구분할 이름
        id: "community",
        // 화면에 표시할 이름
        label: "커뮤니티",
        // 메뉴 선택 시 이동할 주소
        path: "/service/community",
        // 기능 또는 계산 방식의 설명
        description:
            "한국 생활의 경험과 정보를 나누고, 서로의 이야기를 만나보세요.",
        // 주 기능에 포함된 세부 기능 목록
        children: [],
    },
];

// 회원 화면의 이름과 주소
export const accountRoutes = [
    { label: "로그인", path: "/login" },
    { label: "회원가입", path: "/signup" },
    { label: "마이페이지", path: "/mypage" },
    { label: "프로필 수정", path: "/mypage/edit" },
    { label: "내 금융 정보", path: "/my-finance" },
];

// 선택할 수 있는 언어
export const languages = [
    { value: "ko", label: "한국어" },
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日本語" },
    { value: "vi", label: "Tiếng Việt" },
    { value: "th", label: "ไทย" },
];