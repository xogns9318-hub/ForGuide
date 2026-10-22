// 화면 상태와 생명주기를 관리하는 React 기능 사용
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 주소 이동과 현재 경로를 확인하는 라우터 기능 사용
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
// 이 화면에서 사용할 스타일 연결
import "./styles/common.css";
import "./i18n/i18n";

// index.html에 React 화면 표시
createRoot(document.getElementById("root")).render(
    <StrictMode>
        {/* 주소 이동 기능 연결 */}
        <BrowserRouter>
            {/* 전체 앱의 공통 상태와 경로 표시 시작 */}
            <App />
        </BrowserRouter>
    </StrictMode>,
);