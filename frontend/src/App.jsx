// 화면 상태와 생명주기를 관리하는 React 기능 사용
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AppRoutes from "./routes/AppRoutes.jsx";

// 공통 상태를 관리하고 페이지 경로 연결
export default function App() {
    const { i18n } = useTranslation();
    // 로그인 연결 전에는 비로그인 상태로 회원 메뉴 표시
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <AppRoutes
            language={i18n.resolvedLanguage || i18n.language}
            isLoggedIn={isLoggedIn}
            onLanguageChange={(language) => i18n.changeLanguage(language)}
            onLogout={() => setIsLoggedIn(false)}
        />
    );
}