import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Banner from "../Banner/Banner.jsx";
import { categories } from "../../routes/routeConfig";
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
    const { t } = useTranslation();
    return (
        <div className="page-stack">
            {/* 홈 배너 */}
            <Banner
                eyebrow={t("home.banner.eyebrow")}
                title={t("home.banner.title")}
                description={t("home.banner.description")}
            />

            {/* 서비스 소개 */}
            <section aria-labelledby="home-services-title">
                <p className="home-services-eyebrow">
                    {t("home.services.eyebrow")}
                </p>
                <h2 id="home-services-title">
                    {t("home.services.title")}
                </h2>
                <p className="home-services-intro">
                    {t("home.services.description")}
                </p>

                {/* 주 기능 카드 6개 */}
                <div className="home-service-grid">
                    {categories.map((category) => (
                        <article
                            key={category.id}
                            className="home-service-card"
                        >
                            <div className="home-service-icon">
                                <ServiceIcon id={category.id} />
                            </div>

                            {/* 주 기능 페이지로 이동 */}
                            <h3>
                                <Link
                                    to={category.path}
                                    className="home-category-link"
                                >
                                    {t(`navigation.${category.id}`, {
                                        defaultValue: category.label,
                                    })}
                                </Link>
                            </h3>

                            <p>{t(`home.categories.${category.id}.description`, {
                                        defaultValue: category.description,
                                })}</p>

                            {/* 세부 기능이 있을 때만 버튼 표시 */}
                            {category.children.length > 0 && (
                                <ul className="home-feature-list">
                                    {category.children.map((child) => (
                                        <li key={child.path}>
                                            <Link to={child.path} className="button">
                                                {t(`home.features.${category.id}.${child.path.split("/").pop()}`, {
                                                    defaultValue: child.label,
                                                })}
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