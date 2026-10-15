import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React 코드를 처리하도록 설정
export default defineConfig({
    plugins: [react()],

    // 개발 서버: /api 요청을 백엔드(Spring, 8080)로 전달
    // 프론트와 같은 주소로 보이게 해서 refresh token 쿠키(SameSite=Strict)가 실리게 한다
    server: {
        proxy: {
            "/api": "http://localhost:8080",
        },
    },
});