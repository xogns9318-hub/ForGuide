import { Link, Outlet, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { categories, accountRoutes } from "./routeConfig";
import { useTranslation } from "react-i18next";
import Home from "../components/Home/Home.jsx";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import StatusPage from "../components/StatusPage/StatusPage.jsx";
import Community from "../components/Community/Community.jsx";
import CommunityPostDetail from "../components/Community/CommunityPostDetail.jsx";
import { authPaths, authRoutes } from "../auth/authRoutes.jsx";
import { recommendPaths, recommendRoutes } from "../recommend/recommendRoutes.jsx";
import introductionStyles from "../styles/introduction.module.css";
import MonthlyPayment from "../components/MonthlyPayment/MonthlyPayment.jsx";
import TotalInterest from "../components/TotalInterest/TotalInterest.jsx";
import Consultation from "../components/Consultation/Consultation.jsx";
import EmploymentResume from "../components/Employment/EmploymentResume.jsx";
import JobListings from "../components/JobListings/JobListings.jsx";
import UnderConstruction from "../components/UnderConstruction/UnderConstruction.jsx";
import RequireAuth from "../auth/components/RequireAuth.jsx";

// 제작 중 화면을 표시할 서비스 주소만 지정
const constructionPaths = new Set([
    "/service/preparationCard",
    "/service/simulator",
]);

// 소개와 세부 기능을 연결할 서비스 주소 목록
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
function DefaultLayout({ language, isLoggedIn, onLanguageChange, onLogout }) {
    const { pathname } = useLocation();
    // 홈 화면만 전체 너비로 표시하고 다른 화면의 공통 규격은 유지한다.
    const isHome = pathname === "/";

    return (
        <div className="app-layout">
            <Header
                language={language}
                isLoggedIn={isLoggedIn}
                onLanguageChange={onLanguageChange}
                onLogout={onLogout}
            />

            <main className={isHome ? "page-main page-main--home" : "page-main"}>
                <Outlet />
            </main>

            {!isHome && <Footer />}
        </div>
    );
}

// 세부 기능별 아이콘 모양
const featureIconPaths = {
    "/service/consultation": "M4 4h13v10H9l-5 4V4 M10 14v4h7l4 3V9h-4 M7 8h7 M7 11h4",
    "/service/preparationCard":
        "M8 5H5v16h14V5h-3 M9 3h6v4H9z M8 11l1 1 2-2 M13 11h3 M8 16l1 1 2-2 M13 16h3",
    "/service/loan": "M4 6h16v14H4z M4 10h16 M7 15h4 M17 3v5 M15 5h4",
    "/service/insurance": "M12 3l8 3v6c0 5-4 8-8 10-4-2-8-5-8-10V6z M8 12l3 3 5-6",
    "/service/account": "M3 9l9-6 9 6H3z M5 11v7 M10 11v7 M14 11v7 M19 11v7 M3 21h18",
    "/service/monthlyPayment":
        "M6 2h12v20H6z M9 6h6 M9 11h1 M14 11h1 M9 15h1 M14 15h1 M9 19h1 M14 19h1",
    "/service/totalInterest": "M4 20h16 M7 17v-5 M12 17V8 M17 17V4",
    "/service/jobListings": "M3 7h18v13H3z M8 7V4h8v3 M3 12h18 M10 12v3h4v-3",
    "/service/employment": "M6 3h9l4 4v14H6z M15 3v5h4 M9 12h7 M9 16h7",
    "/service/simulator": "M3 5h18v16H3z M3 9h18 M7 3v4 M17 3v4 M7 13h2 M12 13h2 M7 17h2",
    "/service/community": "M3 3h13v11H9l-4 4v-4H3z M16 8h5v11h-4l-4 3v-8 M6 7h7 M6 10h4",
};

// 소개 페이지 문구는 홈 카드와 분리된 번역 항목을 사용한다.
function PlaceholderPage({ title, description, categoryId, serviceId, children = [] }) {
    const { t } = useTranslation();
    const isIntroduction = Boolean(categoryId) && !serviceId;

    const translatedTitle = serviceId
        ? t(`home.features.${categoryId}.${serviceId}`, { defaultValue: title })
        : categoryId
            ? t(`navigation.${categoryId}`, { defaultValue: title })
            : title;

    if (isIntroduction) {
        return (
            <article className={introductionStyles.page} aria-labelledby="introduction-title">
                <header className={introductionStyles.heading}>
                    <h1 id="introduction-title">{translatedTitle}</h1>

                    <p className={introductionStyles.description}>
                        {t(`introduction.${categoryId}.description`, {
                            defaultValue: description ?? "",
                        })}
                    </p>
                </header>

                <section
                    className={introductionStyles.featureList}
                    aria-label={t("introduction.featuresLabel", {
                        name: translatedTitle,
                    })}
                >
                    {/* 세부 기능 수에 따라 카드와 페이지 높이가 함께 바뀐다. */}
                    {children.map((feature) => {
                        const key = `introduction.${categoryId}.features.${feature.id}`;
                        const featureTitle = t(`${key}.title`, {
                            defaultValue: feature.label,
                        });

                        return (
                            <Link
                                key={feature.path}
                                to={feature.path}
                                className={introductionStyles.feature}
                                aria-labelledby={`introduction-${categoryId}-${feature.id}`}
                            >
                                <div className={introductionStyles.featureIdentity}>
                                    <svg
                                        className={introductionStyles.icon}
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

                                    <h2 id={`introduction-${categoryId}-${feature.id}`}>
                                        {featureTitle}
                                    </h2>
                                </div>

                                <p className={introductionStyles.featureDescription}>
                                    {t(`${key}.description`, {
                                        defaultValue: feature.description ?? "",
                                    })}
                                </p>
                            </Link>
                        );
                    })}
                </section>
            </article>
        );
    }

    const translatedDescription = serviceId
        ? t(`service.${serviceId}.description`, {
            defaultValue: description ?? "",
        })
        : description;

    return (
        <section className="panel">
            <h1>{translatedTitle}</h1>
            {translatedDescription && <p className="text-muted">{translatedDescription}</p>}
        </section>
    );
}

// 계산기는 기존 내용과 간격을 유지하고 공통 배너 호출을 제거한다.
function CalculatorPage({ children }) {
    return <div className="page-stack">{children}</div>;
}

// 일반 화면과 전체 상태 화면 연결
export default function AppRoutes({ language, isLoggedIn, onLanguageChange, onLogout }) {
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
                <Route path="/service/community" element={<Community />} />

                <Route path="/service/community/posts/:postId" element={<CommunityPostDetail />} />

                {/* 게시글 작성 전용 페이지 */}
                <Route
                    path="/service/community/write"
                    element={<Navigate to="/service/community" replace />}
                />

                {/* 도움 기관 안내는 선택 화면으로 연결 */}
                <Route path="/service/consultation" element={<Consultation />} />

                {/* 별도 화면으로 연결한 경로는 기본 서비스 목록에서 제외 */}
                {serviceRoutes
                    .filter(
                        (route) =>
                            route.path !== "/service/community" &&
                            route.path !== "/service/consultation" &&
                            route.path !== "/service/employment" &&
                            !recommendPaths.includes(route.path),
                    )
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={
                                constructionPaths.has(route.path) ? (
                                    <UnderConstruction />
                                ) : route.path === "/service/monthlyPayment" ? (
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
                                ) : route.path === "/service/employment" ? (
                                    <EmploymentResume />
                                ) : route.path === "/service/jobListings" ? (
                                    <JobListings />
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

                {/* 이력서 작성은 로그인한 회원만 가능 */}
                <Route element={<RequireAuth />}>
                    <Route
                        path="/service/employment"
                        element={<EmploymentResume />}
                    />
                </Route>

                {/* 추천 화면 */}
                {recommendRoutes()}

                {/* 회원가입·로그인·마이페이지 */}
                {authRoutes()}

                {/* 로그인 라우트와 중복되지 않는 기존 회원 페이지 */}
                {accountRoutes
                    .filter((route) => !authPaths.includes(route.path))
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<PlaceholderPage title={route.label} />}
                        />
                    ))}
            </Route>

            <Route path="/loading" element={<StatusPage type="loading" />} />
            <Route path="/empty" element={<StatusPage type="empty" />} />
            <Route path="/failure" element={<StatusPage type="failure" />} />
            <Route path="/input-error" element={<StatusPage type="input" />} />
            <Route path="/example" element={<StatusPage type="example" />} />
            <Route path="/error" element={<StatusPage type="error" />} />
            <Route path="*" element={<StatusPage type="error" />} />
        </Routes>
    );
}
