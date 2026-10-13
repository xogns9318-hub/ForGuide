// MOCK: 서버 연결 전 커뮤니티 카드 모양을 확인하기 위한 예시 게시글입니다.
const communityPosts = [
    {
        id: 1,
        author: "민*",
        content:
            "생활비 계획을 세우면서 대출 조건을 비교해 보고 있어요. 금리만 보지 말고 상환 방식과 비용도 같이 정리하려고 합니다. 상담 전에 확인할 질문을 메모해 두니 마음이 조금 편해졌어요.",
        likes: 1,
        comments: 1,
        reply: "저도 질문 목록을 만들어서 상담 때 가져가려고 해요. 로그인",
    },
    {
        id: 2,
        author: "L**",
        content:
            "보험 안내를 읽다가 이미 가입한 보장과 겹치는지 궁금했어요. 먼저 기존 계약 내용을 찾아보고, 모르는 용어는 상담할 때 물어보려고 합니다.",
        likes: 0,
        comments: 1,
    },
    {
        id: 3,
        author: "안*",
        content:
            "첫 면접을 준비 중이에요. 이력서에 어떤 경험을 적을지 정리하고, 근무 시간과 급여 지급일에 대해 물어볼 한국어 문장도 연습하고 있어요.",
        likes: 0,
        comments: 1,
    },
    {
        id: 4,
        author: "M**",
        content:
            "상담 설명카드를 미리 정리해 보니까 제 상황에서 무엇을 먼저 물어봐야 할지 알겠어요. 실제 이용 조건은 기관에 다시 확인하려고 합니다.",
        likes: 0,
        comments: 1,
    },
    {
        id: 5,
        author: "린*",
        content:
            "어려운 보험 용어를 하나씩 메모하고 있어요. 가입 전에 비용과 보장 제외 항목을 어떻게 설명받으면 좋을지 질문 목록을 만드는 중입니다.",
        likes: 0,
        comments: 1,
    },
    {
        id: 6,
        author: "J**",
        content:
            "취업 준비자료를 한곳에 모으는 중이에요. 체류자격에 따른 근무 가능 여부는 공식 안내로 확인하고, 면접 일정 전에 준비물을 체크하려고 합니다.",
        likes: 0,
        comments: 1,
    },
];

export async function getCommunityPosts() {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return communityPosts;
}
