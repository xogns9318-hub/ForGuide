import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { categories, contactRoutes } from "../../routes/routeConfig.js";
import { GreetingDuck } from "../UnderConstruction/UnderConstruction.jsx";
import styles from "../../styles/home.module.css";

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
        titleKey: "header.mega.contact",
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
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState("main");
    const syncedHash = useRef(null);
    const movingTo = useRef(null);

    const scrollToSection = useCallback((id, behavior) => {
        const element = document.getElementById(id);
        if (!element) return;

        const headerHeight =
            parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue("--header-height"),
            ) || 88;

        const maxTop = Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight,
        );

        const top = Math.min(
            maxTop,
            Math.max(
                0,
                element.getBoundingClientRect().top +
                    window.scrollY -
                    headerHeight -
                    16,
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
        if (location.hash === syncedHash.current) return;

        syncedHash.current = location.hash;
        const id = location.hash.slice(1);

        // 직접 해시 접근과 뒤로·앞으로 이동에도 헤더 여백을 적용한다.
        const frame = requestAnimationFrame(() => {
            scrollToSection(sectionIds.includes(id) ? id : "main", "auto");
        });

        return () => cancelAnimationFrame(frame);
    }, [location.hash, scrollToSection]);

    useEffect(() => {
        let frame = 0;

        function updateSection() {
            frame = 0;

            if (movingTo.current) {
                if (Math.abs(window.scrollY - movingTo.current.top) > 2) return;

                const { id } = movingTo.current;
                movingTo.current = null;
                setActiveId(id);
                return;
            }

            const probe = window.innerHeight * 0.35;
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
                    <p>{t("homeMain.description")}</p>
                </div>
            </section>

            <div className={styles.home}>
                {sections.map((section, index) => (
                    <section
                        key={section.id}
                        id={section.id}
                        className={`${styles.section} ${index % 2 ? styles.right : ""}`}
                        aria-labelledby={`home-${section.id}`}
                    >
                        <div className={styles.content}>
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
                    </section>
                ))}
            </div>
        </>
    );
}