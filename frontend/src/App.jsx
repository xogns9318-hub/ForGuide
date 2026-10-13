import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppRoutes from "./routes/AppRoutes.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import { logout, restoreSession } from "./api/authApi.js";

// 공통 상태를 관리하고 페이지 경로 연결
export default function App() {
    const { i18n } = useTranslation();
    const navigate = useNavigate();

    // 로그인 여부는 인증 스토어의 access token 유무로 판단한다
    const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken));

    // 로그아웃 요청 중복 방지 (버튼을 여러 번 눌러도 한 번만 보낸다)
    const loggingOut = useRef(false);

    // 앱이 처음 열릴 때 한 번: refresh token 쿠키로 로그인 상태를 되살린다
    // 실패(쿠키 없음·만료)는 로그아웃 상태로 시작하는 정상 결과다
    // 개발 모드 StrictMode에서 두 번 실행돼도 재발급 요청은 tokenRefresh에서 한 번만 나간다
    useEffect(() => {
        restoreSession()
            .catch(() => {})
            .finally(() => useAuthStore.getState().setInitialized());
    }, []);

    // 헤더 로그아웃: 서버·화면의 로그인 상태를 지우고 홈으로 이동
    async function handleLogout() {
        if (loggingOut.current) return;
        loggingOut.current = true;

        try {
            // 서버 요청이 실패해도 logout()이 화면의 로그인 상태는 반드시 지운다
            await logout();
        } catch {
            // 로그아웃 실패를 사용자에게 막는 오류로 보여 주지 않는다
        } finally {
            loggingOut.current = false;
            navigate("/", { replace: true });
        }
    }

    return (
        <AppRoutes
            language={i18n.resolvedLanguage || i18n.language}
            isLoggedIn={isLoggedIn}
            onLanguageChange={(language) => i18n.changeLanguage(language)}
            onLogout={handleLogout}
        />
    );
}
