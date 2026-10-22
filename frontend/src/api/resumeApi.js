// 브라우저가 새로고침되면 함께 사라지는 메모리 초안 목록입니다.
let resumeDraftsInMemory = [];

// 실제 서버 요청처럼 0.5초 후 결과를 돌려준다.
function waitForMockResponse() {
    return new Promise((resolve) => {
        setTimeout(resolve, 500);
    });
}

// MOCK: 현재 작성 중인 이력서를 브라우저 메모리에만 저장한다.
export async function saveResumeDraft({ resumeType, resume }) {
    await waitForMockResponse();

    const savedResume = {
        id: crypto.randomUUID(),
        resumeType,
        savedAt: new Date().toISOString(),
        // 사진은 현재 미리보기 전용이라 초안에 저장하지 않는다.
        resume: {
            ...resume,
            photoPreviewUrl: "",
        },
    };

    // 같은 양식의 기존 초안은 제외하고, 최신 초안만 남긴다.
    resumeDraftsInMemory = [
        savedResume,
        ...resumeDraftsInMemory.filter(
            (draft) => draft.resumeType !== resumeType,
        ),
    ];

    return savedResume;
}

// MOCK: 현재 화면이 열린 동안 저장된 초안 목록을 불러온다.
export async function getResumeDrafts() {
    await waitForMockResponse();

    return [...resumeDraftsInMemory];
}

// MOCK: 선택한 이력서 한 건을 메모리에서 불러온다.
export async function getResumeDraft(resumeId) {
    await waitForMockResponse();

    return resumeDraftsInMemory.find(
        (draft) => draft.id === resumeId,
    );
}