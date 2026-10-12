import { Outlet, Route, Routes } from "react-router-dom";
import { categories, accountRoutes } from "./routeConfig";
import Home from "../components/Home/Home.jsx";
import Banner from "../components/Banner/Banner.jsx";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import StatusPage from "../components/StatusPage/StatusPage.jsx";

// 배너를 연결할 서비스 주소 목록
const serviceRoutes = categories.flatMap((category) => [
    {
        label: category.label,
        path: category.path,
        description: category.description,
    },
    ...category.children,
]);

// 일반 페이지의 공통 레이아웃
function DefaultLayout({
    language,
    isLoggedIn,
    onLanguageChange,
    onLogout,
}) {
    return (
        <div className="app-layout">
            {/* 공통 헤더 */}
            <Header
                language={language}
                isLoggedIn={isLoggedIn}
                onLanguageChange={onLanguageChange}
                onLogout={onLogout}
            />

            {/* 현재 일반 페이지 표시 */}
            <main className="page-main">
                <Outlet />
            </main>

            {/* 공통 푸터 */}
            <Footer />
        </div>
    );
}

// 아직 본문이 없는 페이지의 배너
function PlaceholderPage({ title, description }) {
    return (
        <div className="page-stack">
            <Banner title={title} description={description} />
        </div>
    );
}

// 일반 화면과 전체 상태 화면 연결
export default function AppRoutes({
    language,
    isLoggedIn,
    onLanguageChange,
    onLogout,
}) {
    return (
        <Routes>
            {/* 헤더와 푸터가 있는 일반 페이지 */}
            <Route
                element={
                    <DefaultLayout
                        language={language}
                        isLoggedIn={isLoggedIn}
                        onLanguageChange={onLanguageChange}
                        onLogout={onLogout}
                    />
                }
            >
                {/* 홈 화면 */}
                <Route path="/" element={<Home />} />

                {/* 서비스 페이지 */}
                {serviceRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <PlaceholderPage
                                title={route.label}
                                description={route.description}
                            />
                        }
                    />
                ))}

                {/* 회원 페이지 */}
                {accountRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <PlaceholderPage title={route.label} />
                        }
                    />
                ))}
            </Route>

            {/* 로딩 화면 */}
            <Route
                path="/loading"
                element={<StatusPage type="loading" />}
            />

            {/* 빈 결과 화면 */}
            <Route
                path="/empty"
                element={<StatusPage type="empty" />}
            />

            {/* 조회 실패와 재시도 화면 */}
            <Route
                path="/failure"
                element={<StatusPage type="failure" />}
            />

            {/* 입력 검증 초안 */}
            <Route
                path="/input-error"
                element={<StatusPage type="input" />}
            />

            {/* 예시 표시와 마스킹 초안 */}
            <Route
                path="/example"
                element={<StatusPage type="example" />}
            />

            {/* 잘못된 접근 화면 */}
            <Route
                path="/error"
                element={<StatusPage type="error" />}
            />

            {/* 등록되지 않은 주소 안내 */}
            <Route
                path="*"
                element={<StatusPage type="error" />}
            />
        </Routes>
    );
}