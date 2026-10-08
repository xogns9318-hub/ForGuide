import { Link, useLocation } from "react-router-dom";
import { categories, languages } from "../../routes/routeConfig";
import { useState } from "react";
import "../../styles/header.css";


export default function Header({
    isLoggedIn = false,
    language = "ko",
    onLanguageChange,
    onLogout,
}) {
    const { pathname } = useLocation();

    // 한 번에 하나의 세부 메뉴만 표시
    const [openMenu, setOpenMenu] = useState(null);
    // 현재 페이지가 속한 카테고리 확인
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
                        // 키보드 포커스가 메뉴 밖으로 나가면 닫기
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
                                className={`nav-link ${isCategoryActive(category) ? "is-active" : ""
                                    }`}
                                aria-current={pathname === category.path ? "page" : undefined}
                                onFocus={() => setOpenMenu(category.id)}
                                onClick={() => setOpenMenu(null)}
                            >
                                {category.label}
                            </Link>

                            {category.children.length > 0 && openMenu === category.id && (
                                <div className="nav-dropdown">
                                    {category.children.map((child) => (
                                        <Link
                                            key={child.path}
                                            to={child.path}
                                            className="nav-dropdown-link"
                                            aria-current={pathname === child.path ? "page" : undefined}
                                            onClick={() => setOpenMenu(null)}
                                        >
                                            {child.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="header-actions">
                    {/* 로그인 상태에 따라 메뉴 변경 */}
                    {isLoggedIn ? (
                        <>
                            <Link to="/mypage">마이페이지</Link>
                            <Link to="/my-finance">내 금융 정보</Link>
                            <button
                                type="button"
                                className="header-logout"
                                onClick={onLogout}
                            >
                                로그아웃
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">로그인</Link>
                            <Link to="/signup">회원가입</Link>
                        </>
                    )}

                    <label className="header-language">
                        <span>Language</span>
                        <select
                            value={language}
                            onChange={(event) => {
                                onLanguageChange?.(event.target.value);

                                // 마우스로 선택한 뒤 포커스 해제
                                if (event.currentTarget.matches(":hover")) {
                                    event.currentTarget.blur();
                                }
                            }}
                        >
                            {languages.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>
        </header>
    );
}