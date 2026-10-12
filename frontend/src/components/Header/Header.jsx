import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { categories, languages } from "../../routes/routeConfig";
import "../../styles/header.css";

// 로고와 메뉴 표시
export default function Header({
    isLoggedIn = false,
    language = "ko",
    onLanguageChange,
    onLogout,
}) {
    // 현재 페이지 주소
    const { pathname } = useLocation();

    // 열려 있는 메뉴
    const [openMenu, setOpenMenu] = useState(null);

    // 현재 메뉴의 강조 여부
    const isCategoryActive = (category) => {
        return (
            pathname === category.path ||
            category.children.some((child) => pathname === child.path)
        );
    };

    return (
        <header className="site-header">
            <div className="site-header-inner">
                {/* 로고를 누르면 홈으로 이동 */}
                <Link to="/" className="site-logo" aria-label="ForGuide 홈">
                    <img src="/ForGuide_Logo.png" alt="ForGuide" />
                </Link>

                {/* 주 기능 메뉴 */}
                <nav
                    className="site-navigation"
                    aria-label="주요 서비스"
                    onMouseLeave={() => setOpenMenu(null)}
                    onBlur={(event) => {
                        // 메뉴 밖으로 이동하면 닫기
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                            setOpenMenu(null);
                        }
                    }}
                    onKeyDown={(event) => {
                        // Esc 키로 메뉴 닫기
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
                            {/* 주 기능 페이지로 이동 */}
                            <Link
                                to={category.path}
                                className={`nav-link ${
                                    isCategoryActive(category) ? "is-active" : ""
                                }`}
                                aria-current={
                                    pathname === category.path ? "page" : undefined
                                }
                                onFocus={() => setOpenMenu(category.id)}
                                onClick={() => setOpenMenu(null)}
                            >
                                {category.label}
                            </Link>

                            {/* 선택한 메뉴의 세부 기능 */}
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
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                        </div>
                    ))}
                </nav>

                <div className="header-actions">
                    {/* 로그인 여부에 따른 회원 메뉴 */}
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

                    {/* 언어 선택 */}
                    <label className="header-language">
                        <span>Language</span>
                        <select
                            value={language}
                            onChange={(event) => {
                                // 선택한 언어 전달
                                onLanguageChange?.(event.target.value);

                                // 마우스 선택 후 테두리 해제
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