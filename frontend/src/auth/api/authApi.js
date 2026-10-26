import { client } from "../../api/client.js";
import { refreshAccessToken } from "../../api/tokenRefresh.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { clearResumeTemporaryDraft } from "../../utils/resumeDraftStorage.js";

// ── 회원가입·로그인·로그아웃 API (화면은 이 함수들만 쓴다) ──

// 아이디 중복 확인 → { available }
export async function checkLoginId(loginId) {
    return client.get(`/auth/check-login-id?loginId=${encodeURIComponent(loginId)}`);
}

// 회원가입 → { memberId, loginId, name, email } (비밀번호는 응답에 없다)
export async function signup({ loginId, password, name, email }) {
    return client.post("/auth/signup", { loginId, password, name, email });
}

// 로그인 → { accessToken, member }
// 성공하면 스토어에 로그인 상태를 저장한다. refresh token은 서버가 HttpOnly 쿠키로 내려준다.
export async function login({ loginId, password }) {
    const data = await client.post("/auth/login", { loginId, password });

    useAuthStore.getState().setAuth({
        accessToken: data.accessToken,
        member: data.member,
    });
    return data;
}

// 로그인 복원 (앱 시작 시 한 번)
// access token은 메모리에만 있어 새로고침하면 사라지므로, refresh token 쿠키로 다시 받아 온다
// 쿠키가 없으면 비로그인 상태로 시작한다 (정상)
export async function restoreSession() {
    await refreshAccessToken();
}

// 로그아웃
// 서버에서 refresh token을 지우고(쿠키 포함), 실패하더라도 이 화면의 로그인 상태는 반드시 지운다
export async function logout() {
    const memberId = useAuthStore.getState().member?.memberId;

    try {
        await client.post("/auth/logout");
    } finally {
        if (memberId) {
            clearResumeTemporaryDraft(memberId);
        }
        useAuthStore.getState().clearAuth();
    }
}
