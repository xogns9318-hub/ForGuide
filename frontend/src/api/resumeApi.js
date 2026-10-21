const RESUME_STORAGE_KEY = "forguide-resume-drafts";

// 실제 서버 요청처럼 0.5초 후 결과 돌려준다.
function waitForMockResponse() {
    return new Promise((resolve) => {
        setTimeout(resolve, 500);
    });
}

function readSavedResumes() {
    const savedValue = localStorage.getItem(RESUME_STORAGE_KEY);

    if(!savedValue) {
        return [];
    }

    try {
        return JSON.parse(savedValue);
    } catch {
        return [];
    }
}

function keepLatestResumeByType(resumes) {
    const latestByType = new Map();

    resumes.forEach((resume) => {
        const previousResume = latestByType.get(
            resume.resumeType,
        );

        const isNewerResume = !previousResume
            || new Date(resume.savedAt)
                > new Date(previousResume.savedAt);

        if (isNewerResume) {
            latestByType.set(resume.resumeType, resume);
        }
    });

    return [...latestByType.values()];
}

// MOCK : 현재 작성 중인 이력서를 부라우저에 저장
export async function saveResumeDraft({ resumeType, resume}) {
    await waitForMockResponse();

    const savedResume = {
        id: crypto.randomUUID(),
        resumeType,
        savedAt: new Date().toISOString(),
        // 사진은 현재 미리보기 전용이라 저장 초안 제외
        resume: {
            ...resume,
            photoPreviewUrl: "",
        },
    };

    const latestResumes = keepLatestResumeByType([
        savedResume,
        ...readSavedResumes(),
    ]);

    localStorage.setItem(
        RESUME_STORAGE_KEY,
        JSON.stringify(latestResumes),

    );

    return savedResume;
}

// MOCK : 저장한 이력서 목록을 불러온다
export async function getResumeDrafts() {
    await waitForMockResponse();

    const latestResumes = keepLatestResumeByType(
        readSavedResumes(),
    );

    // 예전에 쌓인 중복 초안도 불러오기 시점에 정리한다.
    localStorage.setItem(
        RESUME_STORAGE_KEY,
        JSON.stringify(latestResumes),
    );

    return latestResumes;
}

// MOCK : 선택한 이력서 한 건의 내용을 불러온다.
export async function getResumeDraft(resumeId) {
    await waitForMockResponse();

    return readSavedResumes().find(
        (resume) => resume.id === resumeId,
    );
}