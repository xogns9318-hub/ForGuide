// 주소 이동과 현재 경로를 확인하는 라우터 기능 사용
import { Link, Outlet, Route, Routes } from "react-router-dom";
// 메뉴 이름과 주소를 공통 경로 설정에서 사용
import { categories, accountRoutes } from "./routeConfig";
import Home from "../components/Home/Home.jsx";
import Banner from "../components/Banner/Banner.jsx";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import StatusPage from "../components/StatusPage/StatusPage.jsx";
// 이 화면에서 사용할 스타일 연결
import "../styles/home.css";
import MonthlyPayment from "../components/MonthlyPayment/MonthlyPayment.jsx";
import TotalInterest from "../components/TotalInterest/TotalInterest.jsx";

// 배너와 세부 기능을 연결할 서비스 주소 목록
const serviceRoutes = categories.flatMap((category) => [
    {
        // 화면에 표시할 이름
        label: category.label,
        // 메뉴 선택 시 이동할 주소
        path: category.path,
        // 기능 또는 계산 방식의 설명
        description: category.description,
        // 주 기능에 포함된 세부 기능 목록
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
                {/* 주소와 일치하는 자식 페이지를 이 위치에 표시 */}
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
    // 기능 또는 계산 방식의 설명
    description,
    // 주 기능에 포함된 세부 기능 목록
    children = [],
}) {
    return (
        <div className="page-stack">
            {/* 경로 설정의 제목과 설명으로 공통 배너 표시 */}
            <Banner title={title} description={description} />

            {children.length > 0 && (
                <section aria-label={`${title} 세부 기능`}>
                    {/* 경로 목록을 공통 카드 배치로 표시 */}
                    <div className="home-service-grid">
                        {children.map((feature) => (
                            <Link
                                key={feature.path}
                                to={feature.path}
                                className="home-service-card feature-guide-card"
                                aria-label={feature.label}
                            >
                                {/* 서비스 아이콘을 공통 배경 영역 안에 표시 */}
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

                                {/* 결과 또는 서비스 영역 제목 표시 */}
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
                            route.path === "/service/monthlyPayment" ? (
                                <div className="page-stack">
                                    {/* 경로 설정의 제목과 설명으로 공통 배너 표시 */}
                                    <Banner
                                        title={route.label}
                                        description={route.description}
                                    />
                                    {/* 월 상환액 페이지를 공통 계산 화면으로 연결 */}
                                    <MonthlyPayment />
                                </div>
                            ) : route.path === "/service/totalInterest" ? (
                                <div className="page-stack">
                                    {/* 경로 설정의 제목과 설명으로 공통 배너 표시 */}
                                    <Banner
                                        title={route.label}
                                        description={route.description}
                                    />
                                    {/* 총 이자 페이지를 공통 계산 화면으로 연결 */}
                                    <TotalInterest />
                                </div>
                            ) : (
                                <PlaceholderPage
                                    title={route.label}
                                    description={route.description}
                                    children={route.children}
                                />
                            )
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