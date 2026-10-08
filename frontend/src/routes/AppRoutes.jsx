import { Route, Routes } from "react-router-dom";
import { categories, accountRoutes } from "./routeConfig";

// 주 기능과 세부 기능을 하나의 목록으로 정리
const serviceRoutes = categories.flatMap((category) => [
    {
        label: category.label,
        path: category.path,
    },
    ...category.children,
]);

// 실제 페이지를 만들기 전 경로 확인용 화면
function PlaceholderPage({ title }) {
    return (
        <section className="panel">
            <h1>{title}</h1>
        </section>
    );
}

export default function AppRoutes() {
    return (
        <Routes>
            {/* 메인 페이지 본문은 추후 작성 */}
            <Route path="/" element={null} />

            {serviceRoutes.map((route) => (
                <Route
                    key={route.path}
                    path={route.path}
                    element={<PlaceholderPage title={route.label} />}
                />
            ))}

            {accountRoutes.map((route) => (
                <Route
                    key={route.path}
                    path={route.path}
                    element={<PlaceholderPage title={route.label} />}
                />
            ))}

            {/* 등록되지 않은 주소 */}
            <Route
                path="*"
                element={<PlaceholderPage title="페이지를 찾을 수 없습니다." />}
            />
        </Routes>
    );
}