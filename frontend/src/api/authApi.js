import { client } from "./client.js";
import { refreshAccessToken } from "./tokenRefresh.js";
import { ApiError } from "./apiError.js";
import { USE_MOCK, mockDelay } from "./mockConfig.js";
import { useAuthStore } from "../store/useAuthStore.js";
import {
    validateLoginId,
    validatePassword,
    validateName,
    validateEmail,
} from "../utils/validation.js";

// ── 공개 함수 (화면은 이 함수들만 쓴다) ──

// 아이디 중복 확인 → { available }
export async function checkLoginId(loginId) {
    if (USE_MOCK) return mockCheckLoginId(loginId);
    return client.get(
        `/auth/check-login-id?loginId=${encodeURIComponent(loginId)}`,
    );
}

// 회원가입 → { memberId, loginId, name, email } (비밀번호는 응답에 없다)
export async function signup({ loginId, password, name, email }) {
    if (USE_MOCK) return mockSignup({ loginId, password, name, email });
    return client.post("/auth/signup", { loginId, password, name, email });
}

// 로그인 → { accessToken, member }
// 성공하면 스토어에 로그인 상태를 저장한다. refresh token은 서버가 HttpOnly 쿠키로 내려준다.
export async function login({ loginId, password }) {
    const data = USE_MOCK
        ? await mockLogin({ loginId, password })
        : await client.post("/auth/login", { loginId, password });

    useAuthStore.getState().setAuth({
        accessToken: data.accessToken,
        member: data.member,
    });
    return data;
}

// 로그인 복원 (앱 시작 시 한 번)
// access token은 메모리에만 있어 새로고침하면 사라지므로, refresh token 쿠키로 다시 받아 온다
// 쿠키가 없거나 만료되면 실패하는데, 이는 "로그아웃 상태로 시작"이라는 정상 결과다
export async function restoreSession() {
    // MOCK: mock 로그인은 쿠키를 만들지 않으므로 복원할 것이 없다 (서버도 부르지 않음)
    if (USE_MOCK) return;
    await refreshAccessToken();
}

// 로그아웃
// 서버에서 refresh token을 지우고(쿠키 포함), 실패하더라도 이 화면의 로그인 상태는 반드시 지운다
export async function logout() {
    try {
        if (USE_MOCK) {
            await mockDelay();
        } else {
            await client.post("/auth/logout");
        }
    } finally {
        useAuthStore.getState().clearAuth();
    }
}

// ── MOCK 구현 (백엔드 연결 후 삭제) ──

// MOCK: 가상 회원 목록 (실제 개인정보 아님)
// 비밀번호를 평문으로 들고 있는 것은 mock 확인용일 뿐이다. 실제 서버는 BCrypt 해시만 저장·비교한다.
// 새로고침하면 초기화된다 (가입한 회원도 사라짐).
const mockMembers = [
    {
        memberId: 1,
        loginId: "demouser",
        password: "Demo1234!",
        name: "가상회원",
        email: "demo@example.com",
        nickname: null,
        profileImageUrl: null,
    },
];

// MOCK: 응답에 넣을 회원 정보 (비밀번호 제외)
function toMemberResponse({ password: _password, ...member }) {
    return member;
}

// MOCK: 서버 측 입력 검증 (@Valid 역할). 실패한 항목을 모아 한 번에 돌려준다
function assertValid(fieldErrors) {
    const invalid = Object.fromEntries(
        Object.entries(fieldErrors).filter(([, message]) => message),
    );
    if (Object.keys(invalid).length > 0) {
        throw new ApiError("INVALID_INPUT", "입력 내용을 확인해주세요.", {
            status: 400,
            fieldErrors: invalid,
        });
    }
}

async function mockCheckLoginId(loginId) {
    await mockDelay();
    assertValid({ loginId: validateLoginId(loginId) });

    const available = !mockMembers.some((m) => m.loginId === loginId);
    return { available };
}

async function mockSignup({ loginId, password, name, email }) {
    await mockDelay();
    assertValid({
        loginId: validateLoginId(loginId),
        password: validatePassword(password),
        name: validateName(name),
        email: validateEmail(email),
    });

    // 이메일은 대소문자를 구분하지 않고 비교·저장한다
    const normalizedEmail = email.trim().toLowerCase();

    // 중복 확인 뒤 다른 사람이 먼저 가입한 경우도 서버가 다시 막는다 (DB UNIQUE 역할)
    if (mockMembers.some((m) => m.loginId === loginId)) {
        throw new ApiError("LOGIN_ID_DUPLICATED", "이미 사용 중인 아이디입니다.", {
            status: 409,
            fieldErrors: { loginId: "이미 사용 중인 아이디입니다." },
        });
    }
    if (mockMembers.some((m) => m.email === normalizedEmail)) {
        throw new ApiError("EMAIL_DUPLICATED", "이미 가입된 이메일입니다.", {
            status: 409,
            fieldErrors: { email: "이미 가입된 이메일입니다." },
        });
    }

    const member = {
        memberId: mockMembers.length + 1,
        loginId,
        password,
        name: name.trim(),
        email: normalizedEmail,
        nickname: null,
        profileImageUrl: null,
    };
    mockMembers.push(member);

    // 가입 응답은 기본 정보만 (닉네임·프로필 이미지는 마이페이지에서 설정)
    const { memberId, name: savedName, email: savedEmail } = member;
    return { memberId, loginId, name: savedName, email: savedEmail };
}

async function mockLogin({ loginId, password }) {
    await mockDelay();

    // 로그인은 형식 규칙을 안내하지 않는다 (가입 규칙을 노출하지 않기 위해 빈 값만 확인)
    assertValid({
        loginId: loginId ? "" : "아이디를 입력해주세요.",
        password: password ? "" : "비밀번호를 입력해주세요.",
    });

    const member = mockMembers.find(
        (m) => m.loginId === loginId && m.password === password,
    );

    // 보안: 아이디와 비밀번호 중 무엇이 틀렸는지 알려 주지 않는다
    if (!member) {
        throw new ApiError(
            "LOGIN_FAILED",
            "아이디 또는 비밀번호가 올바르지 않습니다.",
            { status: 401 },
        );
    }

    return {
        // MOCK: 실제 서버는 서명된 JWT를 준다. 이 값은 형식만 흉내 낸 가짜 토큰이다.
        accessToken: `mock-access-token-${member.memberId}-${Date.now()}`,
        member: toMemberResponse(member),
    };
}
