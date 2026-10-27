import { API_BASE, client } from "./client.js";
import { useAuthStore } from "../auth/store/useAuthStore.js";

// 화면에서 쓰는 소문자 양식값을 서버 저장값으로 변환한다.
function toServerResumeType(resumeType) {
    return resumeType === "blind" ? "BLIND" : "BASIC";
}

// 서버 응답을 기존 이력서 화면이 사용하던 구조로 변환한다.
function toResumeDraft(response) {
    let resume = {};

    try {
        resume = JSON.parse(response.resumeData);
    } catch {
        // 서버 데이터가 깨져도 화면 전체가 멈추지 않도록 빈 양식으로 처리
        resume = {};
    }

    return {
        id: response.resumeId,
        resumeType: response.resumeType === "BLIND"
            ? "blind"
            : "basic",
        savedAt: response.updatedAt,
        photoUrl: response.photoUrl,
        resume: {
            ...resume,
            // 서버 사진은 다음 단계에서 보호 API로 Blob URL을 받아 표시한다.
            photoPreviewUrl: "",
        },
    };
}

// 이력서 내용과 선택한 사진을 실제 서버에 저장한다.
export async function saveResumeDraft({
                                          resumeType,
                                          resume,
                                          photoFile = null,
                                          removePhoto = false,
                                      }) {
    const formData = new FormData();

    formData.append("resumeType", toServerResumeType(resumeType));

    // 미리보기 주소는 브라우저에서만 의미가 있으므로 DB JSON에는 저장하지 않는다.
    const { photoPreviewUrl, ...resumeData } = resume;

    formData.append("resumeData", JSON.stringify(resumeData));
    formData.append("removePhoto", String(removePhoto));

    if (photoFile) {
        formData.append("photo", photoFile);
    }

    const response = await client.post(
        "/employment/resumes",
        formData,
    );

    return toResumeDraft(response);
}

/*
    이력서 입력값 하나를 한국어 번역 초안으로 받는다.
    개인정보가 포함될 수 있어 서버 Redis 캐시를 사용하지 않는다.
 */
export async function translateResumeText(sourceText) {
    return client.post("/employment/resumes/translation", {
        // 화면 언어와 작성 언어가 다를 수 있어 Gemini가 원문 언어를 감지한다.
        sourceLanguage: "auto",
        targetLanguage: "ko",
        sourceText,
    });
}

// 현재 로그인한 회원의 일반·블라인드 이력서 목록을 조회한다.
export async function getResumeDrafts() {
    const responses = await client.get("/employment/resumes");

    return responses.map(toResumeDraft);
}

// 현재 로그인한 회원의 이력서 한 건만 조회한다.
export async function getResumeDraft(resumeId) {
    const response = await client.get(
        `/employment/resumes/${resumeId}`,
    );

    return toResumeDraft(response);
}

// 저장된 일반 이력서의 증명사진을 즉시 삭제한다.
export async function deleteResumePhoto(resumeId) {
    await client.delete(`/employment/resumes/${resumeId}/photo`);
}

// 보호된 사진 API를 인증 요청으로 호출해 브라우저 미리보기 주소를 만든다.
export async function getResumePhotoPreviewUrl(resumeId) {
    const { accessToken } = useAuthStore.getState();

    const response = await fetch(
        `${API_BASE}/employment/resumes/${resumeId}/photo`,
        {
            headers: accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {},
            credentials: "same-origin",
        },
    );

    if (!response.ok) {
        throw new Error("이력서 사진을 불러오지 못했습니다.");
    }

    const photoBlob = await response.blob();

    return URL.createObjectURL(photoBlob);
}
