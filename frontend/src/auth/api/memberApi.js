import { client } from "../../api/client.js";
import { ApiError } from "../../api/apiError.js";
import { USE_MOCK, mockDelay } from "./mockConfig.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { validateProfileImage } from "../utils/profileImage.js";
import { validateNickname } from "../utils/authValidation.js";

// ── 공개 함수 (화면은 이 함수들만 쓴다) ──
// 응답 member: { memberId, loginId, name, email, nickname, profileImageUrl } (비밀번호 없음)
// 변경에 성공하면 스토어의 회원 정보도 함께 갱신한다 (다시 불러오지 않아도 화면에 바로 반영)

// 프로필 이미지 변경
// file: prepareProfileImage()를 거친 파일. 서버로는 multipart/form-data의 "image" 항목으로 보낸다
export async function updateProfileImage(file) {
    let member;
    if (USE_MOCK) {
        member = await mockUpdateProfileImage(file);
    } else {
        const formData = new FormData();
        formData.append("image", file);
        member = await client.patch("/members/me/profile-image", formData);
    }

    useAuthStore.getState().setMember(member);
    return member;
}

// 닉네임 변경 (앞뒤 공백은 빼고 저장, 다른 회원과 중복 허용)
export async function updateNickname(nickname) {
    const member = USE_MOCK
        ? await mockUpdateNickname(nickname)
        : await client.patch("/members/me/nickname", { nickname });

    useAuthStore.getState().setMember(member);
    return member;
}

// ── MOCK 구현 (백엔드 연결 후 삭제) ──

// MOCK: 로그인한 회원 정보가 없으면 서버의 401과 같은 오류
function mockCurrentMember() {
    const { member } = useAuthStore.getState();
    if (!member) {
        throw new ApiError("AUTH_REQUIRED", "로그인이 필요합니다.", { status: 401 });
    }
    return member;
}

// MOCK: 이전에 만든 미리보기 주소 (새 이미지로 바꿀 때 메모리에서 해제)
let mockImageUrl = null;

async function mockUpdateProfileImage(file) {
    await mockDelay();
    const member = mockCurrentMember();

    // MOCK: 서버도 같은 규칙으로 다시 검사한다 (화면 검사를 우회한 요청 대비)
    const message = await validateProfileImage(file);
    if (message) {
        throw new ApiError("INVALID_IMAGE", message, {
            status: 400,
            fieldErrors: { image: message },
        });
    }

    // MOCK: 실제 서버는 서버 폴더에 저장하고 접근 주소를 돌려준다.
    // mock은 브라우저 안의 임시 주소를 쓰므로 새로고침하면 사라진다.
    if (mockImageUrl) URL.revokeObjectURL(mockImageUrl);
    mockImageUrl = URL.createObjectURL(file);

    return { ...member, profileImageUrl: mockImageUrl };
}

async function mockUpdateNickname(nickname) {
    await mockDelay();
    const member = mockCurrentMember();

    // MOCK: 서버도 같은 규칙으로 다시 검사한다
    const message = validateNickname(nickname);
    if (message) {
        throw new ApiError("INVALID_INPUT", message, {
            status: 400,
            fieldErrors: { nickname: message },
        });
    }

    return { ...member, nickname: nickname.trim() };
}
