import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { categories } from "../../routes/routeConfig";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../LanguageSelector/LanguageSelector";
import "../../styles/header.css";

export default function Header({
    isLoggedIn = false,
    onLogout,
}) {
    const { pathname } = useLocation();
    const { t } = useTranslation();
    const [openMenu, setOpenMenu] = useState(null);

    const isCategoryActive = (category) => {
        return (
            pathname === category.path ||
            category.children.some((child) => pathname === child.path)
        );
    };

    return (
        <header className="site-header">
            <div className="site-header-inner">
                <Link to="/" className="site-logo" aria-label="ForGuide 홈">
                    <img src="/ForGuide_Logo.png" alt="ForGuide" />
                </Link>

                <nav
                    className="site-navigation"
                    aria-label="주요 서비스"
                    onMouseLeave={() => setOpenMenu(null)}
                    onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                            setOpenMenu(null);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            setOpenMenu(null);
                        }
                    }}
                >
                    {categories.map((category) => (
                        <div
                            className="nav-item"
                            key={category.id}
                            onMouseEnter={() => setOpenMenu(category.id)}
                        >
                            <Link
                                to={category.path}
                                className={`nav-link ${(
                                        openMenu !== null
                                            ? openMenu === category.id
                                            : isCategoryActive(category)
                                    )
                                        ? "is-active"
                                        : ""
                                    }`}
                                aria-current={
                                    pathname === category.path ? "page" : undefined
                                }
                                onFocus={() => setOpenMenu(category.id)}
                                onClick={() => setOpenMenu(null)}
                            >
                                {t(`navigation.${category.id}`, {
                                    defaultValue: category.label,
                                })}
                            </Link>

                            {category.children.length > 0 &&
                                openMenu === category.id && (
                                    <div className="nav-dropdown">
                                        {category.children.map((child) => (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                className="nav-dropdown-link"
                                                aria-current={
                                                    pathname === child.path
                                                        ? "page"
                                                        : undefined
                                                }
                                                onClick={() => setOpenMenu(null)}
                                            >
                                                {t(`home.features.${category.id}.${child.id}`, {
                                                    defaultValue: child.label,
                                                })}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                        </div>
                    ))}
                </nav>

                <div className="header-actions">
                    {isLoggedIn ? (
                        <>
                            <Link to="/mypage">{t("header.myPage")}</Link>
                            <Link to="/my-finance">{t("header.myFinance")}</Link>
                            <button
                                type="button"
                                className="header-logout"
                                onClick={onLogout}
                            >
                                {t("header.logout")}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">{t("header.login")}</Link>
                            <Link to="/signup">{t("header.signup")}</Link>
                        </>
                    )}

                    <LanguageSelector />
                </div>
            </div>
        </header>
    );
}