import { useAuthStore } from "../auth/store/useAuthStore.js";
import { ApiError } from "./apiError.js";
import { refreshAccessToken } from "./tokenRefresh.js";

// 모든 API 요청의 공통 주소 (프론트와 같은 출처, 개발 시 Vite 프록시로 백엔드에 전달)
export const API_BASE = "/api/v1";

// 응답이 오지 않을 때 기다리는 최대 시간
const TIMEOUT_MS = 10000;

// 서버 응답 { success, data, error }를 해석한다
// 성공이면 data를 돌려주고, 실패면 ApiError를 던진다
export async function parseResponse(response) {
    // 본문이 없거나 JSON이 아닌 응답도 처리한다 (예: 프록시 오류 페이지)
    let body = null;
    const text = await response.text();
    if (text) {
        try {
            body = JSON.parse(text);
        } catch {
            body = null;
        }
    }

    if (response.ok && body?.success !== false) {
        return body?.data ?? null;
    }

    const error = body?.error ?? {};
    throw new ApiError(
        error.code ?? "UNKNOWN_ERROR",
        error.message ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
        { status: response.status, fieldErrors: error.fieldErrors ?? {} },
    );
}

// 서버에 닿지 못한 경우(네트워크 끊김·시간 초과)를 같은 형식의 오류로 바꾼다
export function toNetworkError(error) {
    const timedOut = error?.name === "AbortError";
    return new ApiError(
        timedOut ? "TIMEOUT" : "NETWORK_ERROR",
        timedOut
            ? "응답이 늦어지고 있습니다. 잠시 후 다시 시도해주세요."
            : "서버에 연결하지 못했습니다. 네트워크를 확인해주세요.",
    );
}

// 보안: 우리 API 경로("/auth/login" 형태)만 받는다
// 외부 주소("https://...", "//...")를 받으면 access token이 다른 사이트로 새어 나갈 수 있다
function toApiUrl(path) {
    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
        throw new Error(`API 경로는 "/"로 시작하는 내부 경로여야 합니다: ${path}`);
    }
    return `${API_BASE}${path}`;
}

// 요청 한 번 보내기
async function send(path, { method, body, headers }) {
    const { accessToken } = useAuthStore.getState();

    const requestHeaders = { Accept: "application/json", ...headers };

    // 로그인 상태면 모든 요청에 access token을 붙인다
    if (accessToken) {
        requestHeaders.Authorization = `Bearer ${accessToken}`;
    }

    // 파일 업로드(FormData)는 브라우저가 Content-Type을 정하게 둔다
    let requestBody;
    if (body instanceof FormData) {
        requestBody = body;
    } else if (body !== undefined) {
        requestHeaders["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(toApiUrl(path), {
            method,
            headers: requestHeaders,
            body: requestBody,
            // 같은 출처에만 쿠키를 보낸다 (refresh token 쿠키가 외부로 나가지 않게)
            credentials: "same-origin",
            signal: controller.signal,
        });
        return await parseResponse(response);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw toNetworkError(error);
    } finally {
        clearTimeout(timer);
    }
}

// 공통 요청 함수
// access token이 만료되었으면 재발급 후 원래 요청을 한 번만 다시 보낸다
// 화면 코드는 토큰 만료를 신경 쓰지 않고 이 함수의 결과만 받는다
export async function request(path, { method = "GET", body, headers } = {}) {
    try {
        return await send(path, { method, body, headers });
    } catch (error) {
        if (!(error instanceof ApiError)) throw error;

        // 만료: 재발급 → 한 번만 다시 요청 (다시 실패하면 그대로 오류)
        // 재발급이 실패하면 tokenRefresh가 로그인 정보를 지우고 오류를 던진다
        if (error.code === "TOKEN_EXPIRED") {
            await refreshAccessToken();
            return send(path, { method, body, headers });
        }

        // 위조·형식 오류 토큰: 더 쓰지 않도록 로그인 정보를 지운다
        if (error.code === "TOKEN_INVALID") {
            useAuthStore.getState().clearAuth();
        }

        throw error;
    }
}

// 자주 쓰는 방식별 단축 함수
export const client = {
    get: (path, options) => request(path, { ...options, method: "GET" }),
    post: (path, body, options) => request(path, { ...options, method: "POST", body }),
    patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
    delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};
