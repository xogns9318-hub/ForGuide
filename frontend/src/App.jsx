import { useState } from "react";
import AppRoutes from "./routes/AppRoutes.jsx";

// 공통 상태를 관리하고 페이지 경로 연결
export default function App() {
    // 선택한 언어
    const [language, setLanguage] = useState("ko");

    // 로그인 여부
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <AppRoutes
            language={language}
            isLoggedIn={isLoggedIn}
            onLanguageChange={setLanguage}
            onLogout={() => setIsLoggedIn(false)}
        />
    );
}