import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { categories, contactRoutes } from "../../routes/routeConfig.js";
import { GreetingDuck } from "../components/GreetingDuck/GreetingDuck.jsx";
import styles from "./Home.module.css";

function serviceItems(categoryId) {
    const category = categories.find((item) => item.id === categoryId);

    return category.children.map((child) => ({
        ...child,
        labelKey: `home.features.${categoryId}.${child.id}`,
    }));
}

const sections = [
    {
        id: "translation",
        titleKey: "homeOverview.translation.title",
        items: [{ id: "translation" }],
    },
    {
        id: "counseling",
        titleKey: "navigation.counseling",
        items: serviceItems("counseling"),
    },
    {
        id: "recommendation",
        titleKey: "navigation.recommendation",
        items: serviceItems("recommendation"),
    },
    {
        id: "repayment",
        titleKey: "navigation.repayment",
        items: serviceItems("repayment"),
    },
    {
        id: "employment",
        titleKey: "navigation.employment",
        items: serviceItems("employment"),
    },
    {
        id: "extendedServices",
        titleKey: "header.mega.extendedServices",
        items: [...serviceItems("simulator"), ...serviceItems("community")],
    },
    {
        id: "contact",
        titleKey: "header.mega.contactMenu",
        items: contactRoutes,
    },
];

// 원래 오리의 얼굴 윤곽과 짧은 날개·발 비율을 유지한 옆모습이다.
function WalkingDuck() {
    return (
        <svg
            className={styles.walkingDuck}
            viewBox="0 0 40 48"
            shapeRendering="crispEdges"
            aria-hidden="true"
            focusable="false"
        >
            <path fill="#DCEBE5" d="M10 44h22v2H10z" />

            <g className={styles.farWing}>
                <path fill="#58462D" d="M15 26h5v2h2v5h-2v2h-5v-2h-2v-5h2z" />
                <path fill="#DDE6E2" d="M15 28h5v5h-5z" />
            </g>

            <g className={styles.farFoot}>
                <path fill="#58462D" d="M15 38h5v2h5v4H13v-4h2z" />
                <path fill="#EE9B37" d="M15 40h4v2h4v1h-8z" />
            </g>

            <path
                fill="#58462D"
                d="M14 21h12v2h3v4h2v8h-2v4h-3v2H14v-2h-3v-4H9v-4H7v-4h4v-4h3z"
            />
            <path
                fill="#F7FAF9"
                d="M14 23h12v2h2v4h1v6h-2v3h-3v1h-8v-1h-3v-3h-2v-5H9v-1h4v-4h1z"
            />
            <path fill="#FFFFFF" d="M16 28h8v2h2v7h-2v2h-8v-2h-2v-7h2z" />

            <path fill="#58462D" d="M18 2h4v2h2v4h-8V4h2z" />
            <path fill="#F7FAF9" d="M18 4h4v4h-4z" />

            <path
                fill="#58462D"
                d="M16 6h8v2h4v2h2v4h2v9h-2v3h-4v2H14v-2h-4v-3H8v-9h2v-4h2V8h4z"
            />
            <path
                fill="#FFFFFF"
                d="M16 8h8v2h4v4h2v9h-2v2h-4v1h-8v-1h-4v-2h-2v-9h2v-4h4z"
            />
            <path fill="#DDE6E2" d="M10 16h2v7h2v2h4v1h-4v-1h-2v-2h-2z" />

            <path fill="#58462D" d="M24 15h3v4h-3z" />
            <path fill="#FFFFFF" d="M25 15h1v1h-1z" />
            <path fill="#F0AA80" d="M23 21h4v2h-4z" />

            <path fill="#58462D" d="M29 20h5v2h3v4h-9v-2h-1v-2h2z" />
            <path fill="#F5A13A" d="M29 22h5v2h1v1h-6z" />
            <path fill="#FFD275" d="M30 22h3v1h-3z" />

            <g className={styles.nearFoot}>
                <path fill="#58462D" d="M22 38h5v2h5v4H20v-4h2z" />
                <path fill="#EE9B37" d="M22 40h4v2h4v1h-8z" />
            </g>

            <g className={styles.nearWing}>
                <path fill="#58462D" d="M18 26h4v2h2v5h-2v2h-4v-2h-2v-5h2z" />
                <path fill="#E9EFEC" d="M18 28h4v5h-4z" />
            </g>
        </svg>
    );
}

const sectionIds = ["main", ...sections.map((section) => section.id)];

export default function Home() {
    const { t, i18n } = useTranslation();
    const language = i18n.resolvedLanguage || i18n.language || "ko";
    const illustrationFolder = language.split("-")[0] === "ko" ? "" : "neutral/";
    const location = useLocation();
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState("main");
    const syncedHash = useRef(null);
    const movingTo = useRef(null);
    const homeRef = useRef(null);

    useLayoutEffect(() => {
        const root = homeRef.current;
        if (!root) return;

        const header = document.querySelector("header");
        const contents = root.querySelectorAll("[data-home-reveal]");
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;

        function updateReveal() {
            frame = 0;

            const headerHeight = header?.getBoundingClientRect().height || 88;
            const availableHeight = Math.max(1, window.innerHeight - headerHeight);

            root.style.setProperty("--home-header-height", `${headerHeight}px`);

            // 설명과 그림은 같은 진행률을 쓰고, 등장 방향은 CSS에서 나눈다.
            const revealEnd = headerHeight + availableHeight / 2 + 2;
            const revealStart = Math.max(revealEnd + 1, window.innerHeight - 48);
            const revealDistance = revealStart - revealEnd;
            const atPageEnd =
                window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

            contents.forEach((element) => {
                const section = element.closest("section");
                if (!section) return;

                const bounds = element.getBoundingClientRect();
                const paddingTop = parseFloat(getComputedStyle(section).paddingTop) || 0;
                const anchorOffset = Math.min(
                    bounds.height / 2,
                    Math.max(0, availableHeight / 2 - paddingTop),
                );
                const anchor = bounds.top + anchorOffset;

                // 왼쪽 버튼으로 이동하면 구역 시작점에서 설명과 그림을 모두 표시한다.
                const reachedStart = section.getBoundingClientRect().top <= headerHeight + 2;
                const fullyVisible =
                    reducedMotion.matches ||
                    reachedStart ||
                    atPageEnd ||
                    element.contains(document.activeElement);

                const progress = fullyVisible
                    ? 1
                    : Math.max(0, Math.min(1, (revealStart - anchor) / revealDistance));

                section.style.setProperty("--home-reveal-progress", String(progress));
            });
        }

        function scheduleReveal() {
            if (!frame) frame = requestAnimationFrame(updateReveal);
        }

        // 언어 변경이나 헤더 크기 변경에도 배치를 다시 계산한다.
        const resizeObserver = new ResizeObserver(scheduleReveal);
        if (header) resizeObserver.observe(header);
        contents.forEach((element) => resizeObserver.observe(element));

        updateReveal();

        window.addEventListener("scroll", scheduleReveal, { passive: true });
        // 원을 눌러 이동한 뒤에도 최종 위치에서 표시 상태를 갱신한다.
        document.addEventListener("scrollend", scheduleReveal);
        window.addEventListener("resize", scheduleReveal);
        root.addEventListener("focusin", scheduleReveal);
        root.addEventListener("focusout", scheduleReveal);
        reducedMotion.addEventListener("change", scheduleReveal);

        return () => {
            cancelAnimationFrame(frame);
            resizeObserver.disconnect();
            window.removeEventListener("scroll", scheduleReveal);
            document.removeEventListener("scrollend", scheduleReveal);
            window.removeEventListener("resize", scheduleReveal);
            root.removeEventListener("focusin", scheduleReveal);
            root.removeEventListener("focusout", scheduleReveal);
            reducedMotion.removeEventListener("change", scheduleReveal);
        };
    }, []);

    const scrollToSection = useCallback((id, behavior) => {
        const element = document.getElementById(id);
        if (!element) return;

        // 화면에 적용된 실제 헤더 높이를 기준으로 이동 위치를 계산한다.
        const headerHeight =
            document.querySelector("header")?.getBoundingClientRect().height || 88;

        const maxTop = Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight,
        );

        // 소개 구역의 시작을 헤더 바로 아래에 맞춘다.
        const offset = headerHeight + (id === "main" ? 16 : 0);
        const top = Math.min(
            maxTop,
            Math.max(
                0,
                element.getBoundingClientRect().top + window.scrollY - offset,
            ),
        );

        // 이동 중 지나가는 구역으로 URL이 바뀌지 않게 한다.
        movingTo.current = { id, top };
        setActiveId(id);
        window.scrollTo({ top, behavior });
    }, []);

    useLayoutEffect(() => {
        // 홈은 해시로 위치를 복원하고, 나갈 때 브라우저의 기존 설정을 복원한다.
        const previous = window.history.scrollRestoration;
        window.history.scrollRestoration = "manual";

        return () => {
            window.history.scrollRestoration = previous;
        };
    }, []);

    useLayoutEffect(() => {
        // 다른 서비스로 이동하는 동안 홈의 위치 복원을 실행하지 않는다.
        if (location.pathname !== "/") return;
        if (location.hash === syncedHash.current) return;

        syncedHash.current = location.hash;
        const id = location.hash.slice(1);

        // 직접 해시 접근과 뒤로·앞으로 이동에 헤더 여백을 적용한다.
        const frame = requestAnimationFrame(() => {
            // 예약된 작업보다 페이지 이동이 먼저 끝난 경우에도 중단한다.
            if (window.location.pathname !== "/") return;

            scrollToSection(sectionIds.includes(id) ? id : "main", "auto");
        });

        return () => cancelAnimationFrame(frame);
    }, [location.pathname, location.hash, scrollToSection]);

    useEffect(() => {
        let frame = 0;

        function updateSection() {
            frame = 0;

            // 다른 페이지로 이동한 뒤에는 홈의 주소 갱신을 중단한다.
            if (window.location.pathname !== "/") return;

            if (movingTo.current) {
                if (Math.abs(window.scrollY - movingTo.current.top) > 2) return;

                const { id } = movingTo.current;
                movingTo.current = null;
                setActiveId(id);
                return;
            }

            // 화면의 세로 중앙에 들어온 구역을 현재 소개로 표시한다.
            const headerHeight =
                document.querySelector("header")?.getBoundingClientRect().height || 88;
            const probe =
                headerHeight + (window.innerHeight - headerHeight) / 2;
            let id = "main";

            sectionIds.forEach((candidate) => {
                if (
                    document.getElementById(candidate)?.getBoundingClientRect().top <= probe
                ) {
                    id = candidate;
                }
            });

            if (
                window.scrollY + window.innerHeight >=
                document.documentElement.scrollHeight - 2
            ) {
                id = sectionIds[sectionIds.length - 1];
            }

            setActiveId(id);
            const hash = `#${id}`;

            if (window.location.hash !== hash) {
                syncedHash.current = hash;

                // 스크롤할 때는 방문 기록을 늘리지 않고 주소만 갱신한다.
                navigate(
                    { pathname: "/", search: window.location.search, hash },
                    { replace: true },
                );
            }
        }

        function scheduleUpdate() {
            if (!frame) frame = requestAnimationFrame(updateSection);
        }

        function interruptMove() {
            movingTo.current = null;
            scheduleUpdate();
        }

        function handleKey(event) {
            if (
                ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(
                    event.key,
                )
            ) {
                interruptMove();
            }
        }

        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", interruptMove);
        window.addEventListener("wheel", interruptMove, { passive: true });
        window.addEventListener("touchstart", interruptMove, { passive: true });
        window.addEventListener("pointerdown", interruptMove);
        window.addEventListener("keydown", handleKey);
        scheduleUpdate();

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("scroll", scheduleUpdate);
            window.removeEventListener("resize", interruptMove);
            window.removeEventListener("wheel", interruptMove);
            window.removeEventListener("touchstart", interruptMove);
            window.removeEventListener("pointerdown", interruptMove);
            window.removeEventListener("keydown", handleKey);
        };
    }, [navigate]);

    function selectSection(event, id) {
        if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        event.preventDefault();
        const hash = `#${id}`;
        syncedHash.current = hash;

        if (location.hash !== hash) {
            // 원을 눌러 이동한 위치는 뒤로 가기로 돌아갈 수 있게 기록한다.
            navigate({ pathname: "/", search: location.search, hash });
        }

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        scrollToSection(id, reduced ? "auto" : "smooth");
    }

    return (
        <>
            <nav className={styles.sectionNav} aria-label={t("homeMain.navigationLabel")}>
                {sectionIds.map((id) => (
                    <a
                        key={id}
                        href={`#${id}`}
                        className={styles.sectionJump}
                        aria-label={t(`homeMain.sections.${id}`)}
                        aria-current={activeId === id ? "location" : undefined}
                        onClick={(event) => selectSection(event, id)}
                    >
                        <span className={styles.sectionDot} aria-hidden="true" />
                        <span className={styles.sectionLabel} aria-hidden="true">
                            {t(`homeMain.sections.${id}`)}
                        </span>
                    </a>
                ))}
            </nav>

            <section id="main" className={styles.hero} aria-labelledby="home-main-title">
                <h1 id="home-main-title" className={styles.srOnly}>
                    {t("header.mega.home")}
                </h1>

                <div
                    className={styles.duckStage}
                    role="img"
                    aria-label={t("homeMain.duckLabel")}
                >
                    <div className={styles.duckWalker}>
                        <div className={styles.frontPose} aria-hidden="true">
                            <GreetingDuck className={styles.heroDuck} />
                        </div>

                        <div className={styles.sidePose} aria-hidden="true">
                            <WalkingDuck />
                        </div>
                    </div>
                </div>

                <div className={styles.heroMessage}>
                    <img
                        className={styles.heroLogo}
                        src="/ForGuide_Logo.png"
                        alt={t("header.mega.home")}
                    />
                </div>
            </section>

            <div ref={homeRef} className={styles.home}>
                {sections.map((section, index) => (
                    <section
                        key={section.id}
                        id={section.id}
                        className={`${styles.section} ${index % 2 ? styles.right : ""}`}
                        aria-labelledby={`home-${section.id}`}
                    >
                        <div className={styles.content} data-home-reveal>
                            <h2 id={`home-${section.id}`} className={styles.sectionTitle}>
                                {t(section.titleKey)}
                            </h2>

                            <div className={styles.features}>
                                {section.items.map((item) => {
                                    const Headline = item.labelKey ? "h4" : "h3";

                                    return (
                                        <article key={item.id}>
                                            {item.labelKey && (
                                                <h3 className={styles.featureTitle}>
                                                    <Link
                                                        to={item.path}
                                                        className={styles.featureLink}
                                                    >
                                                        {t(item.labelKey, {
                                                            defaultValue: item.label,
                                                        })}
                                                    </Link>
                                                </h3>
                                            )}

                                            <Headline className={styles.headline}>
                                                {t(`homeOverview.${item.id}.headline`)}
                                            </Headline>
                                            <p className={styles.description}>
                                                {t(`homeOverview.${item.id}.description`)}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                        <img
                            className={styles.illustration}
                            src={`${import.meta.env.BASE_URL}home-illustrations/${illustrationFolder}${section.id}.png`}
                            width={528}
                            height={400}
                            alt=""
                            decoding="async"
                        />
                    </section>
                ))}
            </div>
        </>
    );
}