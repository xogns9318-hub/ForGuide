import { useTranslation } from "react-i18next";
import AppRoutes from "./routes/AppRoutes.jsx";
import { useAuthSession } from "./auth/useAuthSession.js";

// 공통 상태를 관리하고 페이지 경로 연결
export default function App() {
    const { i18n } = useTranslation();
    // 로그인 여부·로그아웃은 auth가 관리 (앱 시작 시 로그인 복원 포함)
    const { isLoggedIn, logout } = useAuthSession();

    return (
        <AppRoutes
            language={i18n.resolvedLanguage || i18n.language}
            isLoggedIn={isLoggedIn}
            onLanguageChange={(language) => i18n.changeLanguage(language)}
            onLogout={logout}
        />
    );
}