// 로그인 후 이동할 주소(?next=)를 안전한 내부 경로로만 돌려준다
// 보안: next를 그대로 쓰면 "/login?next=https://악성사이트"처럼
// 로그인 직후 외부 사이트로 보내는 공격(오픈 리다이렉트)에 쓰일 수 있다.
const AUTH_PAGES = ["/login", "/signup"];

export function getSafeNextPath(next, fallback = "/") {
    if (typeof next !== "string" || !next.startsWith("/")) {
        return fallback;
    }

    // "//evil.com", "/\evil.com"은 브라우저가 외부 주소로 해석한다
    if (next.startsWith("//") || next.startsWith("/\\")) {
        return fallback;
    }

    let url;
    try {
        url = new URL(next, window.location.origin);
    } catch {
        return fallback;
    }

    // 해석 결과가 우리 사이트가 아니면 버린다
    if (url.origin !== window.location.origin) {
        return fallback;
    }

    // 로그인·회원가입 화면으로 되돌아가는 반복을 막는다
    if (AUTH_PAGES.includes(url.pathname)) {
        return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
}
