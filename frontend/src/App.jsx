import { useState } from "react";
import Header from "./components/Header/Header.jsx";
import Footer from "./components/Footer/Footer.jsx";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
    // 헤더에서 사용하는 상태
    const [language, setLanguage] = useState("ko");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <div className="app-layout">
            <Header
                isLoggedIn={isLoggedIn}
                language={language}
                onLanguageChange={setLanguage}
                onLogout={() => setIsLoggedIn(false)}
            />

            {/* 주소에 맞는 본문 표시 */}
            <main className="page-main">
                <AppRoutes />
            </main>

            <Footer />
        </div>
    );
}