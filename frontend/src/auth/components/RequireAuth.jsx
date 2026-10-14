import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";

// 로그인한 사람만 들어가는 화면을 감싸는 레이아웃 라우트
// 사용: <Route element={<RequireAuth />}> 안에 회원 전용 화면을 넣는다
// 주의: 화면을 가리는 것일 뿐 보안의 끝이 아니다. 회원 정보는 서버가 토큰으로 다시 확인해야 한다.
export default function RequireAuth() {
    const accessToken = useAuthStore((state) => state.accessToken);
    const initialized = useAuthStore((state) => state.initialized);
    const location = useLocation();

    // 새로고침 직후 로그인 복원 중에는 판단을 미룬다 (복원 중 로그인 화면으로 튕기지 않게)
    if (!initialized) {
        return (
            <p className="panel text-muted" role="status" aria-live="polite">
                로그인 상태를 확인하고 있습니다…
            </p>
        );
    }

    // 로그인하지 않았으면 로그인 화면으로, 로그인 후 돌아올 원래 주소를 next로 전달
    if (!accessToken) {
        const next = `${location.pathname}${location.search}${location.hash}`;
        return (
            <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
        );
    }

    return <Outlet />;
}
