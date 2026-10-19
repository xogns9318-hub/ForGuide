import { useAuthStore } from "../auth/store/useAuthStore.js";
import { API_BASE, parseResponse, toNetworkError } from "./client.js";

// 진행 중인 재발급 요청 상태를 저장함. refresh token은 쓸 때마다 바뀐다. 
// 같은 쿠키로 두 번 보내면 두 번째가 실패해 로그아웃되고, 여러 곳에서 동시에 불려도 요청은 한 번만 > 모두 같은 결과를 기다린다.

let refreshing = null;

// 토큰 재발급 중복 방지용 함수.
export function refreshAccessToken() {
    // 진행중인 재발급 요청이 없을 때 : 재발급 요청하고 Promise를 저장
    if (!refreshing) {
        refreshing = requestRefresh().finally(() => {
            refreshing = null; // 성공, 실패 여부에 관계 없이 요청 끝나면 비움.
        });
    }
    // 진행중인 재발급 요청이 있을 때 : 기존 Promise를 그대로 반환한다.
    return refreshing;
}

// 서버에 access token 재발급을 요청하고, 받은 토큰을 로그인 저장소에 저장한다.
async function requestRefresh() {
    // 재발급을 시작할 때의 토큰. 응답을 기다리는 사이 사용자가 새로 로그인·로그아웃했다면
    // 늦게 온 재발급 결과가 그 새 상태를 덮어쓰거나 지우지 않게 비교용으로 기억한다.
    const tokenAtStart = useAuthStore.getState().accessToken;
    const isStale = () => useAuthStore.getState().accessToken !== tokenAtStart;

    try {

        // 재발급 실패가 다시 재발급을 부르는 상황을 방지하기 위해 client.request를 쓰지 않는다. 
        // refresh token은 HttpOnly 쿠키라 JavaScript로 읽지 않는다. 브라우저에서 자동으로 전송한다.
        let response;
        try {
            // 재발급 API는 POST 방식으로 호출한다.
            response = await fetch(`${API_BASE}/auth/refresh`, {
                method: "POST",
                credentials: "same-origin", // 현재 페이지와 같은 출처로 요청할 때 쿠키를 함께 보낸다.
                // 서버로부터 JSON 응답을 받기 위함.
                headers: { Accept: "application/json" },
            });
        } catch (error) {
            // 연결에 실패했을 때 에러 처리.
            throw toNetworkError(error);
        }

        // 응답 데이터를 받는다. 
        const data = await parseResponse(response);

        // 응답에 토큰이 없거나, 문자열이 아니거나, 빈 문자열은 성공으로 취급하지 않는다
        if (!data || typeof data.accessToken !== "string" || !data.accessToken) {
            throw new Error("재발급 응답에 access token이 없습니다.");
        }

        // 기다리는 사이 로그인 상태가 바뀌었다면 그 상태를 그대로 둔다
        if (isStale()) {
            return useAuthStore.getState().accessToken;
        }

        // getState()를 통해 React 컴포넌트 밖에서 Zustand 저장소의 값이나 함수를 꺼낸다.
        useAuthStore.getState().setAuth({
            accessToken: data.accessToken,
            member: data.member ?? null, //member가 null이나 undefined이면 null로 한다.
        });
        return data.accessToken;
        
    } catch (error) {
        // 네트워크 오류, 응답 처리 오류, 토큰 누락은 여기서 한번에 받는다.
        // 단, 기다리는 사이 새로 로그인했다면 그 로그인 상태는 지우지 않는다.
        if (!isStale()) {
            useAuthStore.getState().clearAuth();
        }
        throw error;
    }
}
