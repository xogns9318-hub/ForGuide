import { lazy, Suspense } from "react";
import { Outlet, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { categories, accountRoutes } from "./routeConfig";
import { useTranslation } from "react-i18next";
import Home from "../home/pages/Home.jsx";
import Header from "../components/Header/Header.jsx";
import Footer from "../components/Footer/Footer.jsx";
import StatusPage from "../components/StatusPage/StatusPage.jsx";
import { authPaths, authRoutes } from "../auth/authRoutes.jsx";
import { recommendPaths, recommendRoutes } from "../recommend/recommendRoutes.jsx";
import RequireAuth from "../auth/components/RequireAuth.jsx";
import PreparationCard from "../consultation/pages/PreparationCard.jsx";
import RequireAdmin from "../auth/components/RequireAdmin.jsx";

// 자주 열지 않는 기능 화면은 해당 경로에 들어갈 때만 내려받아 초기 번들을 줄인다.
const Community = lazy(() => import("../community/components/Community.jsx"));
const CommunityPostDetail = lazy(() => import("../community/components/CommunityPostDetail.jsx"));
const MonthlyPayment = lazy(() => import("../calculator/pages/MonthlyPayment.jsx"));
const TotalInterest = lazy(() => import("../calculator/pages/TotalInterest.jsx"));
const Consultation = lazy(() => import("../consultation/pages/Consultation.jsx"));
const EmploymentResume = lazy(() => import("../employment/components/EmploymentResume.jsx"));
const JobListings = lazy(() => import("../job-listings/components/JobListings.jsx"));
const Simulator = lazy(() => import("../simulator/pages/Simulator.jsx"));
const AdminDashboard = lazy(() => import("../admin/pages/AdminDashboard.jsx"));
const InquiryPage = lazy(() => import("../inquiry/pages/InquiryPage.jsx"));
const ChatbotPage = lazy(() => import("../chatbot/pages/ChatbotPage.jsx"));
const AdminInquiryPage = lazy(() => import("../admin/pages/AdminInquiryPage.jsx"));
const AdminMemberPage = lazy(() => import("../admin/pages/AdminMemberPage.jsx"));
const AdminCommunityPage = lazy(() => import("../admin/pages/AdminCommunityPage.jsx"));
const AdminRecommendationUsagePage = lazy(
    () => import("../admin/pages/AdminRecommendationUsagePage.jsx"),
);

// 소개 주소를 제외하고 실제 세부 서비스 주소만 연결한다.
const serviceRoutes = categories.flatMap((category) =>
    category.children.map((child) => ({
        ...child,
        categoryId: category.id,
    })),
);

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

            <Footer />
        </div>
    );
}

// 실제 기능 주소의 공통 안내 화면만 남긴다.
function PlaceholderPage({ title, description, categoryId, serviceId }) {
    const { t } = useTranslation();

    const translatedTitle = serviceId
        ? t(`home.features.${categoryId}.${serviceId}`, {
              defaultValue: title,
          })
        : title;

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
        <Suspense fallback={<StatusPage type="loading" />}>
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

                    {/* 문의 작성 전 로그인 여부를 확인하고, 로그인 뒤 같은 주소로 돌아온다. */}
                    <Route element={<RequireAuth />}>
                        <Route path="/contact/inquiry" element={<InquiryPage />} />
                        {/* AI 챗봇 상담: 해결되지 않으면 화면 안 버튼으로 /contact/inquiry에 넘어간다 */}
                        <Route path="/contact/chatbot" element={<ChatbotPage />} />
                    </Route>

                    {/* 커뮤니티 페이지 */}
                    <Route path="/service/community" element={<Community />} />

                    <Route
                        path="/service/community/posts/:postId"
                        element={<CommunityPostDetail />}
                    />

                    {/* 게시글 작성 전용 페이지 */}
                    <Route
                        path="/service/community/write"
                        element={<Navigate to="/service/community" replace />}
                    />

                    {/* 도움 기관 안내는 선택 화면으로 연결 */}
                    <Route path="/service/consultation" element={<Consultation />} />
                    <Route path="/service/simulator" element={<Simulator />} />
                    <Route path="/service/preparationCard" element={<PreparationCard />} />

                    {/* 별도 화면으로 연결한 경로는 기본 서비스 목록에서 제외 */}
                    {serviceRoutes
                        .filter(
                            (route) =>
                                route.path !== "/service/community" &&
                                route.path !== "/service/consultation" &&
                                route.path !== "/service/preparationCard" &&
                                route.path !== "/service/simulator" &&
                                route.path !== "/service/employment" &&
                                !recommendPaths.includes(route.path),
                        )
                        .map((route) => (
                            <Route
                                key={route.path}
                                path={route.path}
                                element={
                                    route.path === "/service/monthlyPayment" ? (
                                        <CalculatorPage>
                                            <MonthlyPayment />
                                        </CalculatorPage>
                                    ) : route.path === "/service/totalInterest" ? (
                                        <CalculatorPage>
                                            <TotalInterest />
                                        </CalculatorPage>
                                    ) : route.path === "/service/jobListings" ? (
                                        <JobListings />
                                    ) : (
                                        <PlaceholderPage
                                            title={route.label}
                                            description={route.description}
                                            categoryId={route.categoryId}
                                            serviceId={route.id}
                                        />
                                    )
                                }
                            />
                        ))}

                    {/* 이력서 작성은 로그인한 회원만 가능 */}
                    <Route element={<RequireAuth />}>
                        <Route path="/service/employment" element={<EmploymentResume />} />
                    </Route>

                    {/* 관리자 전용 화면 */}
                    <Route element={<RequireAdmin />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/inquiries" element={<AdminInquiryPage />} />
                        <Route path="/admin/community" element={<AdminCommunityPage />} />
                        <Route path="/admin/members" element={<AdminMemberPage />} />
                        <Route
                            path="/admin/recommendation-usage"
                            element={<AdminRecommendationUsagePage />}
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

                <Route path="*" element={<StatusPage type="error" />} />
            </Routes>
        </Suspense>
    );
}
