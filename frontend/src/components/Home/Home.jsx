// 주소 이동과 현재 경로를 확인하는 라우터 기능 사용
import { Link } from "react-router-dom";
import Banner from "../Banner/Banner.jsx";
// 메뉴 이름과 주소를 공통 경로 설정에서 사용
import { categories } from "../../routes/routeConfig";
// 이 화면에서 사용할 스타일 연결
import "../../styles/home.css";

// 서비스 아이콘 모양
const iconPaths = {
    counseling:
        "M4 4h13v10H9l-5 4V4 M10 14v4h7l4 3V9h-4 M7 8h7 M7 11h4",
    recommendation:
        "M5 4h10v16H5z M8 8h4 M8 12h4 M8 16h3 M18 3v6 M15 6h6",
    repayment:
        "M6 2h12v20H6z M9 6h6 M9 11h1 M14 11h1 M9 15h1 M14 15h1 M9 19h1 M14 19h1",
    employment:
        "M3 7h18v13H3z M8 7V4h8v3 M3 12h18 M10 12v3h4v-3",
    simulator:
        "M3 5h18v16H3z M3 9h18 M7 3v4 M17 3v4 M7 13h2 M12 13h2 M7 17h2",
    community:
        "M3 3h13v11H9l-4 4v-4H3z M16 8h5v11h-4l-4 3v-8 M6 7h7 M6 10h4",
};

// 서비스 아이콘 표시
function ServiceIcon({ id }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d={iconPaths[id]} />
        </svg>
    );
}

// 홈 배너와 서비스 카드 표시
export default function Home() {
    return (
        <div className="page-stack">
            {/* 홈 배너 */}
            <Banner
                eyebrow="한국 생활의 길잡이, ForGuide"
                title="당신의 행복한 한국 생활을 돕는 곳"
                description="여기 홈입니다."
            />

            {/* 서비스 소개 */}
            <section aria-labelledby="home-services-title">
                <p className="home-services-eyebrow">
                    ForGuide 서비스
                </p>
                {/* 결과 또는 서비스 영역 제목 표시 */}
                <h2 id="home-services-title">
                    어떤 도움이 필요하세요?
                </h2>
                <p className="home-services-intro">
                    한국 생활에 필요한 여섯 가지 서비스를 한눈에 살펴보세요.
                </p>

                {/* 주 기능 카드 6개 */}
                <div className="home-service-grid">
                    {/* 공통 카테고리 목록으로 메뉴 또는 카드 생성 */}
                    {categories.map((category) => (
                        <article
                            key={category.id}
                            className="home-service-card"
                        >
                            {/* 서비스 아이콘을 공통 배경 영역 안에 표시 */}
                            <div className="home-service-icon">
                                <ServiceIcon id={category.id} />
                            </div>

                            {/* 주 기능 페이지로 이동 */}
                            <h3>
                                <Link
                                    to={category.path}
                                    className="home-category-link"
                                >
                                    {category.label}
                                </Link>
                            </h3>

                            <p>{category.description}</p>

                            {/* 세부 기능이 있을 때만 버튼 표시 */}
                            {category.children.length > 0 && (
                                <ul className="home-feature-list">
                                    {category.children.map((child) => (
                                        <li key={child.path}>
                                            <Link to={child.path} className="button">
                                                {child.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}