import { Link, Outlet, Route, Routes, Navigate } from "react-router-dom";
import { categories, accountRoutes } from "./routeConfig";
import { useTranslation } from "react-i18next";
import Home from "../components/Home/Home.jsx";
import Banner from "../components/Banner/Banner.jsx";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import StatusPage from "../components/StatusPage/StatusPage.jsx";
import Community from "../components/Community/Community.jsx";
import { authPaths, authRoutes } from "../auth/authRoutes.jsx";
import "../styles/home.css";
import MonthlyPayment from "../components/MonthlyPayment/MonthlyPayment.jsx";
import TotalInterest from "../components/TotalInterest/TotalInterest.jsx";
import Consultation from "../components/Consultation/Consultation.jsx";

// 배너와 세부 기능을 연결할 서비스 주소 목록
const serviceRoutes = categories.flatMap((category) => [
    {
        categoryId: category.id,
        label: category.label,
        path: category.path,
        description: category.description,
        children: category.children,
    },
    ...category.children.map((child) => ({
        ...child,
        categoryId: category.id,
    })),
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
            <Header
                language={language}
                isLoggedIn={isLoggedIn}
                onLanguageChange={onLanguageChange}
                onLogout={onLogout}
            />

            <main className="page-main">
                <Outlet />
            </main>

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

// 아직 본문이 없는 페이지의 배너 + 주 기능 안내 카드
function PlaceholderPage({
    title,
    description,
    categoryId,
    serviceId,
    children = [],
}) {
    const { t } = useTranslation();

    // 기존 다국어 번역 기능 유지
    const translatedTitle = serviceId
        ? t(`home.features.${categoryId}.${serviceId}`, {
            defaultValue: title,
        })
        : categoryId
            ? t(`navigation.${categoryId}`, {
                defaultValue: title,
            })
            : title;

    const translatedDescription = serviceId
        ? t(`service.${serviceId}.description`, {
            defaultValue: description,
        })
        : categoryId
            ? t(`home.categories.${categoryId}.description`, {
                defaultValue: description,
            })
            : description;

    return (
        <div className="page-stack">
            <Banner
                title={translatedTitle}
                description={translatedDescription}
            />

            {/* develop에서 추가한 주 기능 안내 카드 */}
            {children.length > 0 && (
                <section aria-label={`${translatedTitle} 세부 기능`}>
                    <div className="home-service-grid">
                        {children.map((feature) => (
                            <Link
                                key={feature.path}
                                to={feature.path}
                                className="home-service-card feature-guide-card"
                                aria-label={t(
                                    `home.features.${categoryId}.${feature.id}`,
                                    { defaultValue: feature.label }
                                )}
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
                                    {t(
                                        `home.features.${categoryId}.${feature.id}`,
                                        { defaultValue: feature.label }
                                    )}
                                </h2>

                                <p>
                                    {t(
                                        `service.${feature.id}.description`,
                                        { defaultValue: feature.description }
                                    )}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// 계산기에도 세부 기능과 같은 번역 배너를 표시합니다.
function CalculatorPage({ categoryId, serviceId, title, description, children }) {
    const { t } = useTranslation();
    const translatedTitle = t(`home.features.${categoryId}.${serviceId}`, {
        defaultValue: title,
    });
    const translatedDescription = t(`service.${serviceId}.description`, {
        defaultValue: description,
    });

    return (
        <div className="page-stack">
            <Banner title={translatedTitle} description={translatedDescription} />
            {children}
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
                <Route path="/" element={<Home />} />

                {/* 커뮤니티 페이지 */}
                <Route
                    path="/service/community"
                    element={<Community />}
                />

                {/* 게시글 작성 전용 페이지 */}
                <Route
                    path="/service/community/write"
                    element={<Navigate to="/service/community" replace />}
                />

                {/* 도움 기관 안내는 선택 화면으로 연결 */}
                <Route
                    path="/service/consultation"
                    element={<Consultation />}
                />

                {/* 별도 화면으로 연결한 경로는 기본 서비스 목록에서 제외 */}
                {serviceRoutes
                    .filter(
                        (route) =>
                            route.path !== "/service/community" &&
                            route.path !== "/service/consultation",
                    )
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                route.path === "/service/monthlyPayment" ? (
                                    <CalculatorPage
                                        categoryId={route.categoryId}
                                        serviceId={route.id}
                                        title={route.label}
                                        description={route.description}
                                    >
                                        <MonthlyPayment />
                                    </CalculatorPage>
                                ) : route.path === "/service/totalInterest" ? (
                                    <CalculatorPage
                                        categoryId={route.categoryId}
                                        serviceId={route.id}
                                        title={route.label}
                                        description={route.description}
                                    >
                                        <TotalInterest />
                                    </CalculatorPage>
                                ) : (
                                    <PlaceholderPage
                                        title={route.label}
                                        description={route.description}
                                        categoryId={route.categoryId}
                                        serviceId={route.id}
                                        children={route.children}
                                    />
                                )
                            }
                        />
                    ))}

                {/* 회원가입·로그인·마이페이지 */}
                {authRoutes()}

                {/* 로그인 라우트와 중복되지 않는 기존 회원 페이지 */}
                {accountRoutes
                    .filter((route) => !authPaths.includes(route.path))
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                <PlaceholderPage title={route.label} />
                            }
                        />
                    ))}
            </Route>

            <Route
                path="/loading"
                element={<StatusPage type="loading" />}
            />
            <Route
                path="/empty"
                element={<StatusPage type="empty" />}
            />
            <Route
                path="/failure"
                element={<StatusPage type="failure" />}
            />
            <Route
                path="/input-error"
                element={<StatusPage type="input" />}
            />
            <Route
                path="/example"
                element={<StatusPage type="example" />}
            />
            <Route
                path="/error"
                element={<StatusPage type="error" />}
            />
            <Route
                path="*"
                element={<StatusPage type="error" />}
            />
        </Routes>
    );
}
