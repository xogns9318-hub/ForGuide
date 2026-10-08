import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React 코드를 처리하도록 설정
export default defineConfig({
    plugins: [react()],
});