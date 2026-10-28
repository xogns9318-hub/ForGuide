import { client } from "../../api/client.js";
import { refreshAccessToken } from "../../api/tokenRefresh.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { clearResumeTemporaryDraft } from "../../utils/resumeDraftStorage.js";

// ── 회원가입·로그인·로그아웃 API (화면은 이 함수들만 쓴다) ──

// 아이디 중복 확인 → { available }
export async function checkLoginId(loginId) {
    return client.get(`/auth/check-login-id?loginId=${encodeURIComponent(loginId)}`);
}

// 이메일 인증 코드 보내기 → { expiresInSeconds, resendAfterSeconds }
// purpose: "SIGNUP"(회원가입) / "PASSWORD_RESET"(비밀번호 재설정)
export async function sendEmailCode({ email, purpose }) {
    return client.post("/auth/email/send-code", { email, purpose });
}

// 이메일 인증 코드 확인 → { verificationToken } (30분 안에 한 번만 쓸 수 있다)
export async function verifyEmailCode({ email, purpose, code }) {
    return client.post("/auth/email/verify", { email, purpose, code });
}

// 회원가입 → member (비밀번호는 응답에 없다)
// familyName(성)은 선택이라 비워서 보내도 된다. 서버가 표시용 이름 name을 "이름 성"으로 만든다
// emailVerificationToken: verifyEmailCode로 받은 토큰 (없으면 가입되지 않는다)
export async function signup({
    loginId,
    password,
    givenName,
    familyName,
    nickname,
    email,
    emailVerificationToken,
}) {
    return client.post("/auth/signup", {
        loginId,
        password,
        givenName,
        familyName,
        nickname,
        email,
        emailVerificationToken,
    });
}

// 비밀번호 찾기(재설정) → { loginId } (로그인 화면에 미리 채울 아이디)
// verificationToken: verifyEmailCode({ purpose: "PASSWORD_RESET" })로 받은 토큰
// 성공하면 모든 기기의 로그인이 풀리고, 로그인 화면에서 새 비밀번호로 다시 로그인한다
export async function resetPassword({ email, verificationToken, newPassword }) {
    return client.post("/auth/password/reset", { email, verificationToken, newPassword });
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
