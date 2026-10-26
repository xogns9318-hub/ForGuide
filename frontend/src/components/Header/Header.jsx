import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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

    // 닫힐 때도 마지막 목록을 남겨 두어 부드럽게 접히도록 함
    const [visibleMenu, setVisibleMenu] = useState(menus[0]);

    // 목록 길이에 따라 드롭다운 높이를 부드럽게 변경
    const [dropdownHeight, setDropdownHeight] = useState(0);

    // 모바일 전체 메뉴의 열림 상태는 별도로 관리
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [isMobile, setIsMobile] = useState(
        () => window.matchMedia("(max-width: 1024px)").matches,
    );

    // 펼친 목록의 최대 높이를 계산할 실제 헤더 높이
    const [headerHeight, setHeaderHeight] = useState(133);

    // 높이 측정과 키보드 포커스 복원에 사용할 요소 보관
    const headerRef = useRef(null);
    const dropdownContentRef = useRef(null);
    const closeTimerRef = useRef(null);
    const mobileButtonRef = useRef(null);
    const titleRefs = useRef({});

    const isDesktopMenuOpen = !isMobile && openMenu !== null;

    // 다른 카테고리로 이동할 때 내용과 높이를 함께 변경
    function openDesktopMenu(menu) {
        window.clearTimeout(closeTimerRef.current);

        if (isMobile) return;

        // 변경할 카테고리의 내용을 저장
        setVisibleMenu(menu);

        // 선택한 카테고리를 펼친 상태로 변경
        setOpenMenu(menu.id);
    }

    // 마우스가 빠르게 움직여도 드롭다운이 갑자기 닫히지 않게 처리
    function scheduleMenuClose() {
        window.clearTimeout(closeTimerRef.current);

        // 마우스가 메뉴에서 벗어나면 120ms 후 닫기
        closeTimerRef.current = window.setTimeout(() => {
            setOpenMenu(null);
        }, 120);
    }

    // 다시 헤더 위에 올라오면 닫기 예약 취소
    function cancelMenuClose() {
        window.clearTimeout(closeTimerRef.current);
    }

    function closeMenus() {
        cancelMenuClose();

        // 페이지 이동이나 메뉴 종료 시 펼침 상태 초기화
        setOpenMenu(null);
        setIsMobileMenuOpen(false);
    }

    // 다른 페이지로 이동하면 이전 메뉴를 닫음
    useEffect(() => {
        cancelMenuClose();
        setOpenMenu(null);
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // 화면에서 헤더가 사라질 때 예약된 타이머 정리
    useEffect(() => {
        return () => window.clearTimeout(closeTimerRef.current);
    }, []);

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

    // 열려 있는 메뉴의 실제 높이를 측정해서 CSS 높이 애니메이션에 전달
    useLayoutEffect(() => {
        // 모바일이거나 메뉴가 닫혔다면 높이를 0으로 변경
        if (isMobile || openMenu === null) {
            setDropdownHeight(0);
            return;
        }

        const content = dropdownContentRef.current;

        if (!content) return;

        function updateHeight() {
            // 최대 화면 높이 제한까지 반영한 실제 높이를 가져옴
            setDropdownHeight(content.getBoundingClientRect().height);
        }

        // 현재 선택한 카테고리의 목록 높이를 계산
        updateHeight();

        // 번역 문구가 길어지거나 브라우저 너비가 바뀌어도 자동 재계산
        const observer = new ResizeObserver(updateHeight);

        observer.observe(content);

        return () => observer.disconnect();
    }, [isMobile, openMenu, visibleMenu]);

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
            headerRef.current.querySelectorAll(
                'a[href], button:not(:disabled), [tabindex="0"]',
            ),
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
            <div
                className={`${styles.groups} ${menu.id !== "guides" ? styles.singleGroup : ""
                    }`}
            >
                {menu.groups.map((group) => (
                    <section key={group.id} className={styles.group}>
                        {/* 연한 제목은 클릭할 수 없는 p 태그 */}
                        <p className={styles.groupTitle}>
                            {t(group.titleKey)}
                        </p>

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
                                                aria-current={
                                                    isCurrent
                                                        ? "page"
                                                        : undefined
                                                }
                                                onClick={closeMenus}
                                            >
                                                <span>{label}</span>
                                            </Link>
                                        ) : (
                                            // 문의는 버튼만 표시하고 페이지는 연결하지 않음
                                            <button
                                                type="button"
                                                className={styles.menuLink}
                                            >
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
            {/* 메뉴가 열리면 본문에 반투명 검정색과 블러를 부드럽게 표시 */}
            <div
                className={styles.backdrop}
                data-open={isDesktopMenuOpen}
                aria-hidden="true"
                onClick={() => setOpenMenu(null)}
            />

            <header
                ref={headerRef}
                className={[
                    styles.header,
                    isDesktopMenuOpen ? styles.expanded : "",
                ].join(" ")}
                style={{ "--header-height": `${headerHeight}px` }}
                onMouseEnter={cancelMenuClose}
                onMouseLeave={() => {
                    // 빠른 마우스 이동 중 목록이 깜빡이지 않도록 약간 늦게 닫기
                    if (!isMobile) scheduleMenuClose();
                }}
                onBlur={(event) => {
                    // 키보드 포커스가 헤더 밖으로 나가면 닫기
                    if (
                        !isMobile &&
                        !event.currentTarget.contains(event.relatedTarget)
                    ) {
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
                                <img
                                    src="/ForGuide_Logo.png"
                                    alt="ForGuide"
                                />
                            </Link>
                        </div>

                        {renderActions(styles.desktopActions)}

                        {/* 모바일에서는 버튼으로 전체 목록을 열고 닫음 */}
                        <button
                            ref={mobileButtonRef}
                            type="button"
                            className={styles.mobileToggle}
                            aria-label={t(
                                isMobileMenuOpen
                                    ? "header.mega.close"
                                    : "header.mega.open",
                            )}
                            aria-expanded={isMobileMenuOpen}
                            aria-controls={
                                isMobileMenuOpen
                                    ? navigationId
                                    : undefined
                            }
                            onClick={() => {
                                setOpenMenu(null);
                                setIsMobileMenuOpen(
                                    (previous) => !previous,
                                );
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
                    <nav
                        className={styles.navigation}
                        aria-label={t("header.mega.navigation")}
                    >
                        {menus.map((menu) => (
                            <div
                                key={menu.id}
                                className={styles.navItem}
                            >
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
                                    onMouseEnter={() =>
                                        openDesktopMenu(menu)
                                    }
                                    onFocus={() => openDesktopMenu(menu)}
                                    onKeyDown={(event) => {
                                        // 아래 방향키로 목록의 첫 항목에 이동
                                        if (event.key !== "ArrowDown") return;

                                        event.preventDefault();

                                        openDesktopMenu(menu);

                                        requestAnimationFrame(() => {
                                            document
                                                .getElementById(
                                                    `${navigationId}-${menu.id}`,
                                                )
                                                ?.querySelector(
                                                    "a[href], button",
                                                )
                                                ?.focus();
                                        });
                                    }}
                                >
                                    <span>{t(menu.titleKey)}</span>
                                </p>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* 데스크톱 공용 목록: 메뉴가 바뀔 때 높이를 스르륵 변경 */}
                {!isMobile && (
                    <div
                        id={`${navigationId}-${visibleMenu.id}`}
                        className={styles.dropdown}
                        data-open={isDesktopMenuOpen}
                        style={{ height: `${dropdownHeight}px` }}
                        aria-hidden={!isDesktopMenuOpen}
                        inert={!isDesktopMenuOpen}
                    >
                        <div
                            ref={dropdownContentRef}
                            className={styles.dropdownContent}
                        >
                            <div
                                key={visibleMenu.id}
                                className={styles.dropdownBody}
                            >
                                {renderGroups(visibleMenu)}
                            </div>
                        </div>
                    </div>
                )}

                {/* 모바일은 세 메뉴의 목록을 스크롤해서 확인 */}
                {isMobile && isMobileMenuOpen && (
                    <nav
                        id={navigationId}
                        className={styles.mobilePanel}
                        aria-label={t("header.mega.navigation")}
                    >
                        {menus.map((menu) => (
                            <section
                                key={menu.id}
                                className={styles.mobileSection}
                            >
                                <p className={styles.mobileTitle}>
                                    {t(menu.titleKey)}
                                </p>

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
