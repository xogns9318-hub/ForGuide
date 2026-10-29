import { Route } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import MyPage from "./pages/MyPage.jsx";
import ProfileEdit from "./pages/ProfileEdit.jsx";
import PasswordChange from "./pages/PasswordChange.jsx";
import PasswordReset from "./pages/PasswordReset.jsx";
import RequireAuth from "./components/RequireAuth.jsx";

// auth가 화면을 제공하는 주소 (AppRoutes의 임시 화면 목록에서 빼기 위해 쓴다)
export const authPaths = [
    "/signup",
    "/login",
    "/mypage",
    "/mypage/edit",
    "/mypage/password",
    "/password/reset",
];

// 회원 화면 라우트 묶음. AppRoutes의 공통 레이아웃 Route 안에서 {authRoutes()}로 넣는다
export function authRoutes() {
    return (
        <>
            {/* 회원가입·로그인·비밀번호 찾기 (누구나) */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/password/reset" element={<PasswordReset />} />

            {/* 로그인 필요: 로그인하지 않으면 /login?next=원래주소 로 이동 */}
            <Route element={<RequireAuth />}>
                <Route path="/mypage" element={<MyPage />} />
                <Route path="/mypage/edit" element={<ProfileEdit />} />
                <Route path="/mypage/password" element={<PasswordChange />} />
            </Route>
        </>
    );
}
