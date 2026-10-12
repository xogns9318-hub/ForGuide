import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/common.css";

// index.html에 React 화면 표시
createRoot(document.getElementById("root")).render(
    <StrictMode>
        {/* 주소 이동 기능 연결 */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
);