// 주 기능과 세부 기능 경로
export const categories = [
    {
        id: "counseling",
        label: "상담",
        path: "/categories/counseling",
        children: [
            {
                label: "도움 기관 안내",
                path: "/service/consultation",
            },
            {
                label: "상담 준비 카드 만들기",
                path: "/service/preparationCard",
            },
        ],
    },
    {
        id: "recommendation",
        label: "추천",
        path: "/categories/recommendation",
        children: [
            {
                label: "대출 상품 추천",
                path: "/service/loan",
            },
            {
                label: "보험 상품 추천",
                path: "/service/insurance",
            },
            {
                label: "계좌 추천",
                path: "/service/account",
            },
        ],
    },
    {
        id: "repayment",
        label: "계산 도우미",
        path: "/categories/repayment",
        children: [
            {
                label: "월 상환액",
                path: "/service/monthlyPayment",
            },
            {
                label: "총 이자",
                path: "/service/totalInterest",
            },
        ],
    },
    {
        id: "employment",
        label: "취업 도우미",
        path: "/categories/employment",
        children: [
            {
                label: "일자리 목록",
                path: "/service/jobListings",
            },
            {
                label: "취업 준비자료",
                path: "/service/employment",
            },
        ],
    },
    {
        id: "simulator",
        label: "시뮬레이터",
        path: "/service/simulator",
        children: [],
    },
    {
        id: "community",
        label: "커뮤니티",
        path: "/service/community",
        children: [],
    },
];

// 회원 관련 경로
export const accountRoutes = [
    { label: "로그인", path: "/login" },
    { label: "회원가입", path: "/signup" },
    { label: "마이페이지", path: "/mypage" },
    { label: "프로필 수정", path: "/mypage/edit" },
    { label: "내 금융 정보", path: "/my-finance" },
];

// 언어 선택 항목
export const languages = [
    { value: "ko", label: "한국어" },
    { value: "en", label: "English" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日本語" },
    { value: "vi", label: "Tiếng Việt" },
    { value: "th", label: "ไทย" },
];