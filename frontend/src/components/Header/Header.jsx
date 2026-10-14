// 화면 상태와 생명주기를 관리하는 React 기능 사용
import { useEffect, useId, useRef, useState } from "react";
// 주소 이동과 현재 경로를 확인하는 라우터 기능 사용
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
// 메뉴 이름과 주소를 공통 경로 설정에서 사용
import { categories } from "../../routes/routeConfig";
import LanguageSelector from "../LanguageSelector/LanguageSelector.jsx";
// 이 화면에서 사용할 스타일 연결
import "../../styles/header.css";

export default function Header({
    isLoggedIn = false,
    onLogout,
}) {
    const { pathname } = useLocation();
    const { t } = useTranslation();
    // 넓은 화면에서 강조하고 펼칠 카테고리 관리
    const [openMenu, setOpenMenu] = useState(null);

    // 작은 화면의 전체 메뉴 열림 상태 관리
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // 작은 화면에서 펼친 카테고리 하나를 관리
    const [mobileCategory, setMobileCategory] = useState(null);

    // 메뉴 버튼과 펼침 영역을 연결할 식별자 생성
    const mobileMenuId = useId();
    // 메뉴를 닫은 뒤 버튼으로 포커스를 돌려줄 참조
    const menuButtonRef = useRef(null);

    // 전체 메뉴와 펼친 항목을 닫고 버튼으로 포커스 복원
    function closeMobileMenu() {
        // 작은 화면의 전체 메뉴 닫기
        setIsMobileMenuOpen(false);
        // 이전에 펼친 세부 카테고리 초기화
        setMobileCategory(null);
        menuButtonRef.current?.focus();
    }

    // 열린 메뉴 뒤의 본문이 스크롤되지 않도록 처리
    useEffect(() => {
        // 전체 메뉴가 닫혀 있으면 스크롤 차단을 적용하지 않음
        if (!isMobileMenuOpen) {
            return;
        }

        // 메뉴 종료 시 복원할 기존 본문 스크롤 설정 보관
        const previousOverflow = document.body.style.overflow;
        // 전체 메뉴를 보는 동안 뒤쪽 본문의 스크롤 차단
        document.body.style.overflow = "hidden";

        return () => {
            // 메뉴 종료 시 원래 본문 스크롤 설정 복원
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileMenuOpen]);

    // 주소가 바뀌면 이전 메뉴 상태 초기화
    useEffect(() => {
        // 작은 화면의 전체 메뉴 닫기
        setIsMobileMenuOpen(false);
        // 이전에 펼친 세부 카테고리 초기화
        setMobileCategory(null);
        // 넓은 화면의 세부 메뉴와 임시 강조 초기화
        setOpenMenu(null);
    }, [pathname]);

    // 화면 크기가 전환되면 남아 있는 메뉴 상태 초기화
    useEffect(() => {
        // CSS와 같은 너비 기준으로 화면 전환 감지
        const media = window.matchMedia("(max-width: 1024px)");

        // 화면 구간 전환 시 이전 메뉴 상태 초기화
        function handleScreenChange() {
            // 작은 화면의 전체 메뉴 닫기
            setIsMobileMenuOpen(false);
            // 이전에 펼친 세부 카테고리 초기화
            setMobileCategory(null);
            // 넓은 화면의 세부 메뉴와 임시 강조 초기화
            setOpenMenu(null);
        }

        // 화면 너비 구간의 변경 감시 시작
        media.addEventListener("change", handleScreenChange);

        return () => {
            // 화면을 벗어나면 등록한 감시 제거
            media.removeEventListener("change", handleScreenChange);
        };
    }, []);

    // Escape로 메뉴를 닫고 Tab 이동을 열린 헤더 안에서 처리
    function handleMobileKeyDown(event) {
        // 닫힌 메뉴나 이미 처리한 키 입력은 다시 처리하지 않음
        if (!isMobileMenuOpen || event.defaultPrevented) {
            return;
        }

        // Escape로 전체 메뉴를 닫고 버튼에 포커스 복원
        if (event.key === "Escape") {
            // 페이지 새로고침이나 브라우저 기본 키 동작 방지
            event.preventDefault();
            closeMobileMenu();
            return;
        }

        // Tab 이외의 키는 포커스 순환 처리에서 제외
        if (event.key !== "Tab") {
            return;
        }

        // 열린 메뉴 뒤의 본문으로 키보드 포커스가 넘어가지 않도록 처리
        const focusableElements = Array.from(
            event.currentTarget.querySelectorAll(
                'a[href], button:not(:disabled), [tabindex="0"]',
            ),
        ).filter((element) => element.getClientRects().length > 0);

        // 열린 메뉴에서 처음 포커스를 받을 요소
        const first = focusableElements[0];
        // 열린 메뉴에서 마지막으로 포커스를 받을 요소
        const last = focusableElements[focusableElements.length - 1];

        // 첫 요소에서 역방향으로 이동하면 마지막 요소로 연결
        if (event.shiftKey && document.activeElement === first) {
            // 페이지 새로고침이나 브라우저 기본 키 동작 방지
            event.preventDefault();
            last?.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            // 페이지 새로고침이나 브라우저 기본 키 동작 방지
            event.preventDefault();
            first?.focus();
        }
    }

    // 주 기능 또는 해당 세부 기능 경로에 있는지 확인
    function isCategoryActive(category) {
        return (
            pathname === category.path ||
            category.children.some((child) => pathname === child.path)
        );
    }

    return (
        <header
            className="site-header"
            onKeyDown={handleMobileKeyDown}
        >
            <div className="site-header-inner">
                {/* 첫 번째 줄: 로고와 회원·언어 메뉴 */}
                <div className="site-header-top">
                    {/* 로고를 누르면 홈으로 이동 */}
                    <Link
                        to="/"
                        className="site-logo"
                        aria-label="ForGuide 홈"
                    >
                        <img src="/ForGuide_Logo.png" alt="ForGuide" />
                    </Link>

                    {/* 회원 메뉴와 언어 선택을 같은 영역에 표시 */}
                    <div className="header-actions">
                        {/* 로그인 여부에 따라 회원 메뉴 선택 */}
                        {isLoggedIn ? (
                            <>
                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link to="/mypage">
                                    {t("header.myPage")}
                                </Link>

                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link to="/my-finance">
                                    {t("header.myFinance")}
                                </Link>

                                {/* 기존 로그아웃 동작을 실행하는 버튼 */}
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
                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link to="/login">
                                    {t("header.login")}
                                </Link>

                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link to="/signup">
                                    {t("header.signup")}
                                </Link>
                            </>
                        )}

                        {/* 기존 언어 변경 기능을 헤더에서 사용 */}
                        <LanguageSelector />
                    </div>
                    {/* 작은 화면에서만 표시하는 메뉴 버튼 */}
                    <button
                        ref={menuButtonRef}
                        type="button"
                        className="mobile-menu-toggle"
                        aria-label={
                            isMobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"
                        }
                        aria-expanded={isMobileMenuOpen}
                        aria-controls={
                            isMobileMenuOpen ? mobileMenuId : undefined
                        }
                        onClick={() => {
                            if (isMobileMenuOpen) {
                                closeMobileMenu();
                            } else {
                                // 전체 메뉴를 열 때 이전 펼침 상태 초기화
                                setMobileCategory(null);
                                // 넓은 화면의 세부 메뉴와 임시 강조 초기화
                                setOpenMenu(null);
                                // 작은 화면의 전체 메뉴 표시
                                setIsMobileMenuOpen(true);
                            }
                        }}
                    >
                        {/* 이미지 파일 대신 SVG 선으로 아이콘 표시 */}
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path
                                d={
                                    isMobileMenuOpen
                                        ? "M6 6l12 12 M18 6L6 18"
                                        : "M4 6h16 M4 12h16 M4 18h16"
                                }
                            />
                        </svg>
                    </button>
                </div>

                {/* 두 번째 줄: 같은 너비의 카테고리 6칸 */}
                <nav
                    className="site-navigation"
                    aria-label="주요 서비스"
                    onMouseLeave={() => setOpenMenu(null)}
                    onBlur={(event) => {
                        // 키보드 포커스가 메뉴 밖으로 이동하면 닫기
                        if (
                            !event.currentTarget.contains(
                                event.relatedTarget,
                            )
                        ) {
                            // 넓은 화면의 세부 메뉴와 임시 강조 초기화
                            setOpenMenu(null);
                        }
                    }}
                    onKeyDown={(event) => {
                        // Escape로 전체 메뉴를 닫고 버튼에 포커스 복원
                        if (event.key === "Escape") {
                            // 넓은 화면의 세부 메뉴와 임시 강조 초기화
                            setOpenMenu(null);
                        }
                    }}
                >
                    {/* 공통 카테고리 목록으로 메뉴 또는 카드 생성 */}
                    {categories.map((category) => {
                        // 메뉴를 가리키는 동안에는 해당 메뉴만 강조
                        const isActive =
                            openMenu !== null
                                ? openMenu === category.id
                                : isCategoryActive(category);

                        return (
                            <div
                                className="nav-item"
                                key={category.id}
                                onMouseEnter={() =>
                                    setOpenMenu(category.id)
                                }
                            >
                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link
                                    to={category.path}
                                    className={`nav-link ${isActive ? "is-active" : ""
                                        }`}
                                    aria-current={
                                        pathname === category.path
                                            ? "page"
                                            : undefined
                                    }
                                    onFocus={() =>
                                        setOpenMenu(category.id)
                                    }
                                    onClick={() => setOpenMenu(null)}
                                >
                                    {t(`navigation.${category.id}`, {
                                        defaultValue: category.label,
                                    })}
                                </Link>

                                {category.children.length > 0 &&
                                    openMenu === category.id && (
                                        <div className="nav-dropdown">
                                            {category.children.map(
                                                (child) => (
                                                    <Link
                                                        key={child.path}
                                                        to={child.path}
                                                        className="nav-dropdown-link"
                                                        aria-current={
                                                            pathname ===
                                                                child.path
                                                                ? "page"
                                                                : undefined
                                                        }
                                                        onClick={() =>
                                                            setOpenMenu(null)
                                                        }
                                                    >
                                                        {child.label}
                                                    </Link>
                                                ),
                                            )}
                                        </div>
                                    )}
                            </div>
                        );
                    })}
                </nav>
            </div>
            {/* 작은 화면에서는 버튼을 눌렀을 때만 메뉴 표시 */}
            {isMobileMenuOpen && (
                <div
                    id={mobileMenuId}
                    className="mobile-menu-panel"
                >
                    <nav
                        className="mobile-navigation"
                        aria-label="주요 서비스"
                    >
                        {/* 공통 카테고리 목록으로 메뉴 또는 카드 생성 */}
                        {categories.map((category) => {
                            // 현재 언어의 카테고리 이름을 표시하고 기본 이름으로 보완
                            const label = t(
                                `navigation.${category.id}`,
                                { defaultValue: category.label },
                            );

                            // 세부 기능이 있는 카테고리인지 확인
                            const hasChildren =
                                category.children.length > 0;

                            // 현재 카테고리의 펼침 여부 확인
                            const isExpanded =
                                mobileCategory === category.id;

                            // 카테고리 버튼과 세부 목록을 연결할 식별자 생성
                            const submenuId =
                                `${mobileMenuId}-${category.id}`;

                            return (
                                <div
                                    key={category.id}
                                    className="mobile-category"
                                >
                                    {hasChildren ? (
                                        <>
                                            {/* 버튼의 펼침 상태와 연결된 세부 목록을 함께 관리 */}
                                            <button
                                                type="button"
                                                className="mobile-category-toggle"
                                                aria-expanded={isExpanded}
                                                aria-controls={submenuId}
                                                onClick={() => {
                                                    // 같은 항목은 닫고 다른 항목은 펼치기
                                                    setMobileCategory(
                                                        (previous) =>
                                                            previous === category.id
                                                                ? null
                                                                : category.id,
                                                    );
                                                }}
                                            >
                                                <span>{label}</span>

                                                {/* 이미지 파일 대신 SVG 선으로 아이콘 표시 */}
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        d={
                                                            isExpanded
                                                                ? "M6 15l6-6 6 6"
                                                                : "M6 9l6 6 6-6"
                                                        }
                                                    />
                                                </svg>
                                            </button>

                                            {isExpanded && (
                                                <div
                                                    id={submenuId}
                                                    className="mobile-submenu"
                                                >
                                                    {/* 주 기능 안내 페이지도 이동 가능 */}
                                                    <Link
                                                        to={category.path}
                                                        aria-current={
                                                            pathname === category.path
                                                                ? "page"
                                                                : undefined
                                                        }
                                                        onClick={closeMobileMenu}
                                                    >
                                                        {label} 안내
                                                    </Link>

                                                    {category.children.map(
                                                        (child) => (
                                                            <Link
                                                                key={child.path}
                                                                to={child.path}
                                                                aria-current={
                                                                    pathname === child.path
                                                                        ? "page"
                                                                        : undefined
                                                                }
                                                                onClick={closeMobileMenu}
                                                            >
                                                                {child.label}
                                                            </Link>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <Link
                                            to={category.path}
                                            className="mobile-category-link"
                                            aria-current={
                                                pathname === category.path
                                                    ? "page"
                                                    : undefined
                                            }
                                            onClick={closeMobileMenu}
                                        >
                                            {label}
                                        </Link>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* 작은 화면의 회원 메뉴와 언어 선택 */}
                    <div className="header-actions mobile-header-actions">
                        {/* 로그인 여부에 따라 회원 메뉴 선택 */}
                        {isLoggedIn ? (
                            <>
                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link
                                    to="/mypage"
                                    onClick={closeMobileMenu}
                                >
                                    {t("header.myPage")}
                                </Link>

                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link
                                    to="/my-finance"
                                    onClick={closeMobileMenu}
                                >
                                    {t("header.myFinance")}
                                </Link>

                                {/* 기존 로그아웃 동작을 실행하는 버튼 */}
                                <button
                                    type="button"
                                    className="header-logout"
                                    onClick={() => {
                                        onLogout?.();
                                        closeMobileMenu();
                                    }}
                                >
                                    {t("header.logout")}
                                </button>
                            </>
                        ) : (
                            <>
                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link
                                    to="/login"
                                    onClick={closeMobileMenu}
                                >
                                    {t("header.login")}
                                </Link>

                                {/* 연결된 안내 또는 서비스 페이지로 이동 */}
                                <Link
                                    to="/signup"
                                    onClick={closeMobileMenu}
                                >
                                    {t("header.signup")}
                                </Link>
                            </>
                        )}

                        {/* 기존 언어 변경 기능을 헤더에서 사용 */}
                        <LanguageSelector />
                    </div>
                </div>
            )}
        </header>
    );
}