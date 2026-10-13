import { Link, Outlet, Route, Routes } from "react-router-dom";
import { categories, accountRoutes } from "./routeConfig";
import Home from "../components/Home/Home.jsx";
import Banner from "../components/Banner/Banner.jsx";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import StatusPage from "../components/StatusPage/StatusPage.jsx";
import { authPaths, authRoutes } from "../auth/authRoutes.jsx";
import "../styles/home.css";

// 배너와 세부 기능을 연결할 서비스 주소 목록
const serviceRoutes = categories.flatMap((category) => [
    {
        label: category.label,
        path: category.path,
        description: category.description,
        children: category.children,
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

// 세부 기능별 아이콘 모양
const featureIconPaths = {
    "/service/consultation":
        "M4 4h13v10H9l-5 4V4 M10 14v4h7l4 3V9h-4 M7 8h7 M7 11h4",
    "/service/preparationCard":
        "M8 5H5v16h14V5h-3 M9 3h6v4H9z M8 11l1 1 2-2 M13 11h3 M8 16l1 1 2-2 M13 16h3",
    "/service/loan":
        "M4 6h16v14H4z M4 10h16 M7 15h4 M17 3v5 M15 5h4",
    "/service/insurance":
        "M12 3l8 3v6c0 5-4 8-8 10-4-2-8-5-8-10V6z M8 12l3 3 5-6",
    "/service/account":
        "M3 9l9-6 9 6H3z M5 11v7 M10 11v7 M14 11v7 M19 11v7 M3 21h18",
    "/service/monthlyPayment":
        "M6 2h12v20H6z M9 6h6 M9 11h1 M14 11h1 M9 15h1 M14 15h1 M9 19h1 M14 19h1",
    "/service/totalInterest":
        "M4 20h16 M7 17v-5 M12 17V8 M17 17V4",
    "/service/jobListings":
        "M3 7h18v13H3z M8 7V4h8v3 M3 12h18 M10 12v3h4v-3",
    "/service/employment":
        "M6 3h9l4 4v14H6z M15 3v5h4 M9 12h7 M9 16h7",
};

// 주 기능 배너와 세부 기능 연결 카드 표시
function PlaceholderPage({
    title,
    description,
    children = [],
}) {
    return (
        <div className="page-stack">
            <Banner title={title} description={description} />

            {children.length > 0 && (
                <section aria-label={`${title} 세부 기능`}>
                    <div className="home-service-grid">
                        {children.map((feature) => (
                            <Link
                                key={feature.path}
                                to={feature.path}
                                className="home-service-card feature-guide-card"
                                aria-label={feature.label}
                            >
                                <div className="home-service-icon">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d={
                                                featureIconPaths[feature.path] ??
                                                "M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5"
                                            }
                                        />
                                    </svg>
                                </div>

                                <h2 className="feature-guide-title">
                                    {feature.label}
                                </h2>

                                <p>{feature.description}</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
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
                                children={route.children}
                            />
                        }
                    />
                ))}

                {/* 회원가입·로그인·마이페이지 (auth) */}
                {authRoutes()}

                {/* 회원 페이지 (auth가 화면을 제공하지 않는 주소) */}
                {accountRoutes.filter((route) => !authPaths.includes(route.path)).map((route) => (
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