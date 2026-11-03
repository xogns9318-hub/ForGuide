import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/useAuthStore.js";

// ADMIN 역할을 가진 회원만 관리자 화면에 들어가게 한다.
// 실제 API 권한은 백엔드 SecurityConfig가 다시 검증한다.
export default function RequireAdmin() {
    const { t }= useTranslation();
    const accessToken = useAuthStore((state) => state.accessToken);
    const member = useAuthStore((state) => state.member);
    const initialized = useAuthStore((state) => state.initialized);
    const location = useLocation();

    if (!initialized) {
        return (
            <p className="panel text-muted" role="status" aria-live="polite">
                {t("auth.requireAuth.checking")}
            </p>
        );
    }

    if (!accessToken) {
        const next = `${location.pathname}${location.search}${location.hash}`;

        return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
    }

    // 일반 회원은 관리자 주소를 직접 입력해도 홈으로 보낸다.
    if (member?.role !== "ADMIN") {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}