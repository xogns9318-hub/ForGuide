import { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { categories } from "../../routes/routeConfig.js";
import LanguageSelector from "../LanguageSelector/LanguageSelector.jsx";
import styles from "../../styles/headerModule.module.css";

// 주 기능 이름과 기존 주소를 소개 메뉴에서 재사용
const introductionItems = categories.map((category) => ({
    id: category.id,
    path: category.path,
    labelKey: `navigation.${category.id}`,
    label: category.label,
}));

// 하위 기능이 없으면 기존 서비스 주소를 그대로 사용
const guideGroups = categories.map((category) => ({
    id: category.id,
    titleKey: `navigation.${category.id}`,
    items: category.children.length
        ? category.children.map((child) => ({
              ...child,
              labelKey: `home.features.${category.id}.${child.id}`,
          }))
        : introductionItems.filter((item) => item.id === category.id),
}));

// 상단 제목은 이동 주소 없이 펼칠 목록만 구분
const menus = [
    {
        id: "introduction",
        titleKey: "header.mega.introduction",
        groups: [
            {
                id: "introduction",
                titleKey: "header.mega.introductionList",
                items: introductionItems,
            },
        ],
    },
    {
        id: "guides",
        titleKey: "header.mega.guides",
        groups: guideGroups,
    },
    {
        id: "contact",
        titleKey: "header.mega.contact",
        groups: [
            {
                id: "contact",
                titleKey: "header.mega.contactGroup",

                // 문의 페이지가 없으므로 주소 없이 버튼으로 표시
                items: [
                    {
                        id: "myInquiries",
                        labelKey: "header.mega.myInquiries",
                    },
                    {
                        id: "privateInquiry",
                        labelKey: "header.mega.privateInquiry",
                    },
                    {
                        id: "faq",
                        labelKey: "header.mega.faq",
                    },
                ],
            },
        ],
    },
];

export default function Header({ isLoggedIn = false, onLogout }) {
    const { pathname } = useLocation();
    const { t } = useTranslation();
    const navigationId = useId();

    // 넓은 화면에서는 한 메뉴만 펼침
    const [openMenu, setOpenMenu] = useState(null);

    // 모바일 전체 메뉴의 열림 상태는 별도로 관리
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(
        () => window.matchMedia("(max-width: 1024px)").matches,
    );

    // 펼친 목록의 최대 높이를 계산할 실제 헤더 높이
    const [headerHeight, setHeaderHeight] = useState(133);

    // 높이 측정과 키보드 포커스 복원에 사용할 요소 보관
    const headerRef = useRef(null);
    const mobileButtonRef = useRef(null);
    const titleRefs = useRef({});

    // 현재 적용 중인 커뮤니티 전용 헤더 배경 유지
    const isCommunityPage = pathname === "/service/community";
    const isDesktopMenuOpen = !isMobile && openMenu !== null;

    function closeMenus() {
        // 페이지 이동이나 메뉴 종료 시 펼침 상태 초기화
        setOpenMenu(null);
        setIsMobileMenuOpen(false);
    }

    // 다른 페이지로 이동하면 이전 메뉴를 닫음
    useEffect(() => {
        setOpenMenu(null);
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // 화면 구간이 바뀌면 이전 화면의 메뉴 상태 초기화
    useEffect(() => {
        const media = window.matchMedia("(max-width: 1024px)");

        function handleChange(event) {
            setIsMobile(event.matches);
            setOpenMenu(null);
            setIsMobileMenuOpen(false);
        }

        media.addEventListener("change", handleChange);

        return () => {
            media.removeEventListener("change", handleChange);
        };
    }, []);

    // 실제 헤더 높이를 CSS에 전달
    useEffect(() => {
        const element = headerRef.current;

        const observer = new ResizeObserver(() => {
            setHeaderHeight(element.getBoundingClientRect().height);
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    // 모바일 전체 메뉴를 열었을 때 뒤쪽 본문의 스크롤 차단
    useEffect(() => {
        if (!isMobileMenuOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            // 메뉴를 닫으면 기존 스크롤 설정 복원
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileMenuOpen]);

    function handleHeaderKeyDown(event) {
        // 언어 선택창에서 처리한 키 입력은 다시 처리하지 않음
        if (event.defaultPrevented) return;

        if (event.key === "Escape") {
            if (!isMobileMenuOpen && openMenu === null) return;

            event.preventDefault();

            // 포커스를 먼저 복원한 뒤 닫아서 재열림 방지
            if (isMobileMenuOpen) {
                mobileButtonRef.current?.focus();
            } else {
                titleRefs.current[openMenu]?.focus();
            }

            closeMenus();
            return;
        }

        // 모바일 메뉴가 열려 있으면 Tab 이동을 헤더 안에서 순환
        if (!isMobileMenuOpen || event.key !== "Tab") return;

        const elements = Array.from(
            headerRef.current.querySelectorAll('a[href], button:not(:disabled), [tabindex="0"]'),
        ).filter((element) => element.getClientRects().length > 0);

        const first = elements[0];
        const last = elements[elements.length - 1];

        // 포커스가 밖으로 빠졌다면 첫 요소로 복원
        if (!headerRef.current.contains(document.activeElement)) {
            event.preventDefault();
            first?.focus();
            return;
        }

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
        }
    }

    function renderActions(extraClass) {
        return (
            <div className={`${styles.actions} ${extraClass}`}>
                {/* 기존 회원 메뉴와 로그아웃 동작 유지 */}
                {isLoggedIn ? (
                    <>
                        <Link to="/mypage" onClick={closeMenus}>
                            {t("header.myPage")}
                        </Link>

                        <Link to="/my-finance" onClick={closeMenus}>
                            {t("header.myFinance")}
                        </Link>

                        <button
                            type="button"
                            className={styles.logout}
                            onClick={() => {
                                closeMenus();
                                onLogout?.();
                            }}
                        >
                            {t("header.logout")}
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" onClick={closeMenus}>
                            {t("header.login")}
                        </Link>

                        <Link to="/signup" onClick={closeMenus}>
                            {t("header.signup")}
                        </Link>
                    </>
                )}

                {/* 언어 변경과 저장은 기존 컴포넌트에서 처리 */}
                <LanguageSelector />
            </div>
        );
    }

    function renderGroups(menu) {
        return (
            <div className={`${styles.groups} ${menu.id !== "guides" ? styles.singleGroup : ""}`}>
                {menu.groups.map((group) => (
                    <section key={group.id} className={styles.group}>
                        {/* 연한 제목은 클릭할 수 없는 p 태그 */}
                        <p className={styles.groupTitle}>{t(group.titleKey)}</p>

                        <ul className={styles.linkList}>
                            {group.items.map((item) => {
                                const label = t(item.labelKey, {
                                    defaultValue: item.label,
                                });

                                // 서비스의 상세 주소에서도 현재 항목 표시
                                const isCurrent =
                                    item.path &&
                                    (pathname === item.path ||
                                        pathname.startsWith(`${item.path}/`));

                                return (
                                    <li key={item.id}>
                                        {item.path ? (
                                            <Link
                                                to={item.path}
                                                className={styles.menuLink}
                                                aria-current={isCurrent ? "page" : undefined}
                                                onClick={closeMenus}
                                            >
                                                <span>{label}</span>
                                            </Link>
                                        ) : (
                                            // 문의는 버튼만 표시하고 페이지는 연결하지 않음
                                            <button type="button" className={styles.menuLink}>
                                                <span>{label}</span>
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
        );
    }

    return (
        <>
            {/* 헤더 뒤의 본문만 검정색 8%로 어둡게 표시 */}
            {isDesktopMenuOpen && <div className={styles.backdrop} aria-hidden="true" />}

            <header
                ref={headerRef}
                className={[
                    styles.header,
                    isCommunityPage ? styles.community : "",
                    isDesktopMenuOpen ? styles.expanded : "",
                ].join(" ")}
                style={{ "--header-height": `${headerHeight}px` }}
                onMouseLeave={() => {
                    // 펼친 목록까지 벗어나면 넓은 화면의 메뉴 닫기
                    if (!isMobile) setOpenMenu(null);
                }}
                onBlur={(event) => {
                    // 키보드 포커스가 헤더 밖으로 나가면 닫기
                    if (!isMobile && !event.currentTarget.contains(event.relatedTarget)) {
                        setOpenMenu(null);
                    }
                }}
                onKeyDown={handleHeaderKeyDown}
            >
                <div className={styles.inner}>
                    <div
                        className={styles.top}
                        onMouseEnter={() => setOpenMenu(null)}
                        onFocus={() => setOpenMenu(null)}
                    >
                        <div className={styles.brand}>
                            <Link
                                to="/"
                                className={styles.logo}
                                aria-label={t("header.mega.home")}
                                onClick={closeMenus}
                            >
                                <img src="/ForGuide_Logo.png" alt="ForGuide" />
                            </Link>

                            {isCommunityPage && (
                                <span className={styles.communityTitle}>
                                    {t("navigation.community")}
                                </span>
                            )}
                        </div>

                        {renderActions(styles.desktopActions)}

                        {/* 모바일에서는 버튼으로 전체 목록을 열고 닫음 */}
                        <button
                            ref={mobileButtonRef}
                            type="button"
                            className={styles.mobileToggle}
                            aria-label={t(
                                isMobileMenuOpen ? "header.mega.close" : "header.mega.open",
                            )}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls={isMobileMenuOpen ? navigationId : undefined}
                            onClick={() => {
                                setOpenMenu(null);
                                setIsMobileMenuOpen((previous) => !previous);
                            }}
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
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

                    {/* 상단 제목은 이동 링크나 클릭 버튼으로 만들지 않음 */}
                    <nav className={styles.navigation} aria-label={t("header.mega.navigation")}>
                        {menus.map((menu) => (
                            <div key={menu.id} className={styles.navItem}>
                                <p
                                    ref={(element) => {
                                        titleRefs.current[menu.id] = element;
                                    }}
                                    className={styles.menuTitle}
                                    tabIndex={0}
                                    data-open={openMenu === menu.id}
                                    aria-controls={
                                        openMenu === menu.id
                                            ? `${navigationId}-${menu.id}`
                                            : undefined
                                    }
                                    onMouseEnter={() => setOpenMenu(menu.id)}
                                    onFocus={() => setOpenMenu(menu.id)}
                                    onKeyDown={(event) => {
                                        // 아래 방향키로 목록의 첫 항목에 이동
                                        if (event.key !== "ArrowDown") return;

                                        event.preventDefault();
                                        setOpenMenu(menu.id);

                                        requestAnimationFrame(() => {
                                            document
                                                .getElementById(`${navigationId}-${menu.id}`)
                                                ?.querySelector("a[href], button")
                                                ?.focus();
                                        });
                                    }}
                                >
                                    <span>{t(menu.titleKey)}</span>
                                </p>

                                {/* 너비 제한이 없는 바깥 header를 기준으로 펼침 */}
                                {isDesktopMenuOpen && openMenu === menu.id && (
                                    <div
                                        id={`${navigationId}-${menu.id}`}
                                        className={styles.dropdown}
                                    >
                                        {renderGroups(menu)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                {/* 모바일은 세 메뉴의 목록을 스크롤해서 확인 */}
                {isMobile && isMobileMenuOpen && (
                    <nav
                        id={navigationId}
                        className={styles.mobilePanel}
                        aria-label={t("header.mega.navigation")}
                    >
                        {menus.map((menu) => (
                            <section key={menu.id} className={styles.mobileSection}>
                                <p className={styles.mobileTitle}>{t(menu.titleKey)}</p>

                                {renderGroups(menu)}
                            </section>
                        ))}

                        {renderActions(styles.mobileActions)}
                    </nav>
                )}
            </header>
        </>
    );
}
