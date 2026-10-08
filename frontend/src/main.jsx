import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/common.css";

// React 화면을 index.html의 root에 표시
createRoot(document.getElementById("root")).render(
    <StrictMode>
        {/* 웹 주소에 따라 화면 이동 */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
);