import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { categories } from "../../routes/routeConfig.js";
import styles from "../../styles/home.module.css";

const DURATION = 680;
const ANGLE = 28;
const TILT = 0.9;
const WHEEL_THRESHOLD = 32;
const WHEEL_COOLDOWN = DURATION + 90;
const wrap = (value, count) => ((value % count) + count) % count;
// 좌우에 화면 밖 대기 카드를 한 장씩 두어 양방향 진입을 대칭으로 맞춘다.
const distanceFrom = (index, active, count) => {
    const distance = wrap(index - active, count);
    return distance > count / 2 ? distance - count : distance;
};
const visibilityAt = (offset) => Math.max(0, Math.min(1, (2 - Math.abs(offset)) * 2));

const iconPaths = {
    counseling: "M4 4h13v10H9l-5 4V4 M10 14v4h7l4 3V9h-4 M7 8h7 M7 11h4",
    recommendation: "M5 4h10v16H5z M8 8h4 M8 12h4 M8 16h3 M18 3v6 M15 6h6",
    repayment: "M6 2h12v20H6z M9 6h6 M9 11h1 M14 11h1 M9 15h1 M14 15h1 M9 19h1 M14 19h1",
    employment: "M3 7h18v13H3z M8 7V4h8v3 M3 12h18 M10 12v3h4v-3",
    simulator: "M3 5h18v16H3z M3 9h18 M7 3v4 M17 3v4 M7 13h2 M12 13h2 M7 17h2",
    community: "M3 3h13v11H9l-4 4v-4H3z M16 8h5v11h-4l-4 3v-8 M6 7h7 M6 10h4",
};

// 가운데 두 카드는 온전히 표시하고 양옆 카드는 미리보기로 이어 붙인다.
function arcLayout(width, cardWidth, cardHeight, degrees) {
    const radians = (Math.max(0.01, degrees) * Math.PI) / 180;
    const outerAngle = 1.5 * radians;
    const outerTilt = outerAngle * TILT;
    const outerWidth =
        cardWidth * Math.cos(outerTilt) + cardHeight * Math.sin(outerTilt);
    const outerX = width * 0.47 + outerWidth / 2 - cardWidth / 3;
    const radius = outerX / Math.sin(outerAngle);

    const innerAngle = 0.5 * radians;
    const innerTilt = innerAngle * TILT;
    const drop = radius * (1 - Math.cos(innerAngle));
    const rotatedHeight =
        cardWidth * Math.sin(innerTilt) + cardHeight * Math.cos(innerTilt);
    const minY = drop + (cardHeight - rotatedHeight) / 2;

    return { radians, radius, minY, extent: rotatedHeight };
}

// 양옆 카드는 원호를 따라 내려가며 원래 각도로 회전한다.
function cardPose(offset, size, radians, radius, top) {
    const angle = offset * radians;
    const rotation = offset * size.stepAngle * TILT;
    const y = top + radius * (1 - Math.cos(angle));

    return `translate3d(calc(-50% + ${radius * Math.sin(angle)}px), ${y}px, 0) rotate(${rotation}deg)`;
}

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

export default function Home() {
    const { t } = useTranslation();
    const rootRef = useRef(null);
    const stageRef = useRef(null);
    const introductionRefs = useRef([]);
    const animationRef = useRef(0);
    const activeRef = useRef(0);
    const busyRef = useRef(false);
    const focusAfterMoveRef = useRef(false);
    const wheelRef = useRef({ amount: 0, lockedUntil: 0, lastTime: 0 });
    const touchRef = useRef(null);
    const suppressClickRef = useRef(0);
    const [frame, setFrame] = useState({ index: 0, progress: 0, moving: false });
    const [reducedMotion, setReducedMotion] = useState(false);
    const [size, setSize] = useState({
        width: 1280,
        height: 480,
        baseWidth: 640,
        baseHeight: 440,
        cardWidth: 560,
        cardHeight: 385,
        scale: 0.875,
        stepAngle: ANGLE,
        uiScale: 1,
    });

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const update = () => setReducedMotion(query.matches);
        update();
        query.addEventListener("change", update);
        return () => query.removeEventListener("change", update);
    }, []);

    // 브라우저의 남은 높이와 너비에 맞춰 카드와 내부 글씨를 함께 축소한다.
    useLayoutEffect(() => {
        const stage = stageRef.current;
        const root = rootRef.current;
        const measure = () => {
            const width = stage.clientWidth;
            const height = stage.clientHeight;
            const mobile = width <= 768;
            const baseWidth = mobile ? 340 : 640;
            const baseHeight = mobile ? 390 : 440;
            const widthLimit = mobile
                ? Math.min(330, width * 0.34)
                : Math.min(640, width * 0.32);
            const gap = Math.min(16, height * 0.035);

            // 낮은 창에서는 원호도 완만하게 하여 양옆 카드까지 화면 안에 들어오게 한다.
            const stepAngle = Math.min(
                ANGLE,
                (2 * Math.atan2(height * 0.38, Math.max(1, width / 2)) * 180) / (Math.PI * 1.5),
            );
            let low = 0;
            let high = Math.max(0, widthLimit / baseWidth);
            for (let iteration = 0; iteration < 22; iteration += 1) {
                const candidate = (low + high) / 2;
                const layout = arcLayout(
                    width,
                    baseWidth * candidate,
                    baseHeight * candidate,
                    stepAngle,
                );
                if (layout.extent + gap * 2 <= height) low = candidate;
                else high = candidate;
            }
            const scale = Math.floor(low * 10000) / 10000;
            const next = {
                width,
                height,
                baseWidth,
                baseHeight,
                cardWidth: baseWidth * scale,
                cardHeight: baseHeight * scale,
                scale,
                stepAngle,
                uiScale: Math.min(1, root.clientHeight / 320),
            };
            setSize((previous) =>
                Object.keys(next).every((key) => next[key] === previous[key]) ? previous : next,
            );
        };
        const observer = new ResizeObserver(measure);
        observer.observe(stage);
        observer.observe(root);
        measure();
        return () => observer.disconnect();
    }, []);

    // 한 번에 정확히 한 칸 이동하고, 이동 중에는 링크 클릭과 추가 이동을 막는다.
    const move = useCallback(
        (direction, focusCard = false) => {
            if (busyRef.current || Math.abs(direction) !== 1) return;
            const from = activeRef.current;
            const next = wrap(from + direction, categories.length);
            busyRef.current = true;
            focusAfterMoveRef.current = focusCard;
            if (focusCard) stageRef.current.focus({ preventScroll: true });
            const finish = () => {
                activeRef.current = next;
                busyRef.current = false;
                setFrame({ index: next, progress: 0, moving: false });
            };
            if (reducedMotion) {
                finish();
                return;
            }
            const started = performance.now();
            setFrame({ index: from, progress: 0, moving: true });
            const animate = (now) => {
                const elapsed = Math.min(1, (now - started) / DURATION);
                if (elapsed === 1) {
                    finish();
                    return;
                }
                const eased = 1 - Math.pow(1 - elapsed, 3);
                setFrame({ index: from, progress: direction * eased, moving: true });
                animationRef.current = requestAnimationFrame(animate);
            };
            animationRef.current = requestAnimationFrame(animate);
        },
        [reducedMotion],
    );

    useEffect(() => {
        if (!frame.moving && focusAfterMoveRef.current) {
            focusAfterMoveRef.current = false;
            introductionRefs.current[frame.index]?.focus({ preventScroll: true });
        }
    }, [frame.index, frame.moving]);

    // 휠 잠금은 종료 시간을 정해 작은 터치패드 입력이 계속되어도 무기한 연장되지 않게 한다.
    // 홈 전체에서 입력을 받아 카드 밖으로 커서가 이동해도 동일하게 동작한다.
    useEffect(() => {
        const root = rootRef.current;
        const wheel = wheelRef.current;
        const reset = () => {
            wheel.amount = 0;
            wheel.lockedUntil = 0;
            wheel.lastTime = 0;
        };
        const onWheel = (event) => {
            if (event.ctrlKey || event.metaKey) return;
            const raw =
                Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
            if (!raw) return;
            if (event.cancelable) event.preventDefault();
            const now = performance.now();
            if (now - wheel.lastTime > 180) wheel.amount = 0;
            wheel.lastTime = now;
            if (busyRef.current || now < wheel.lockedUntil) {
                wheel.amount = 0;
                return;
            }
            const multiplier =
                event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1;
            wheel.amount += raw * multiplier;
            if (Math.abs(wheel.amount) < WHEEL_THRESHOLD) return;
            const direction = wheel.amount > 0 ? -1 : 1;
            wheel.amount = 0;
            wheel.lockedUntil = now + (reducedMotion ? 180 : WHEEL_COOLDOWN);
            move(direction);
        };
        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") reset();
        };
        root.addEventListener("wheel", onWheel, { passive: false, capture: true });
        window.addEventListener("focus", reset);
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => {
            root.removeEventListener("wheel", onWheel, true);
            window.removeEventListener("focus", reset);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [move, reducedMotion]);

    useEffect(() => () => cancelAnimationFrame(animationRef.current), []);

    // 확대·축소한 실제 카드 크기로 원호의 위치와 기울기를 계산한다.
    const { radians, radius, minY, extent } = arcLayout(
        size.width,
        size.cardWidth,
        size.cardHeight,
        size.stepAngle,
    );
    const top = Math.max(0, (size.height - extent) * 0.28) - minY;
    const nameOf = (category) => t(`navigation.${category.id}`, { defaultValue: category.label });

    const onKeyDown = (event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1, true);
        }
    };
    const onTouchEnd = (event) => {
        if (!touchRef.current) return;
        const point = event.changedTouches[0];
        const dx = point.clientX - touchRef.current.x;
        const dy = point.clientY - touchRef.current.y;
        touchRef.current = null;
        if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
        suppressClickRef.current = performance.now() + 400;
        move(dx > 0 ? -1 : 1);
    };
    const guardClick = (event) => {
        if (busyRef.current || performance.now() < suppressClickRef.current) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    return (
        <div
            ref={rootRef}
            className={styles.home}
            style={{
                "--home-card-width": `${size.cardWidth}px`,
                "--home-card-height": `${size.cardHeight}px`,
                "--home-base-width": `${size.baseWidth}px`,
                "--home-base-height": `${size.baseHeight}px`,
                "--home-card-scale": size.scale,
                "--home-ui-scale": size.uiScale,
            }}
        >
            <section className={styles.intro} aria-labelledby="home-title">
                <h1 id="home-title">{t("home.landing.title")}</h1>
                <p>{t("home.landing.description")}</p>
            </section>
            <section className={styles.carousel} aria-label={t("home.landing.carouselLabel")}>
                <p id="home-carousel-help" className={styles.srOnly}>
                    {t("home.landing.help")}
                </p>
                <div
                    ref={stageRef}
                    className={styles.stage}
                    tabIndex={0}
                    role="region"
                    aria-roledescription={t("home.landing.carouselRole")}
                    aria-label={t("home.landing.carouselLabel")}
                    aria-describedby="home-carousel-help"
                    aria-busy={frame.moving}
                    onKeyDown={onKeyDown}
                    onClickCapture={guardClick}
                    onTouchStart={(event) => {
                        const point = event.touches[0];
                        touchRef.current = { x: point.clientX, y: point.clientY };
                    }}
                    onTouchEnd={onTouchEnd}
                    onTouchCancel={() => {
                        touchRef.current = null;
                    }}
                >
                    {categories.map((category, index) => {
                        const distance = distanceFrom(index, frame.index, categories.length);
                        const offset = distance - 0.5 - frame.progress;
                        const visibility = visibilityAt(offset);
                        const center = Math.abs(offset) < 1 && !frame.moving;
                        const visible = visibility > 0.005;
                        return (
                            <article
                                key={category.id}
                                className={styles.card}
                                data-service-id={category.id}
                                data-center={center}
                                data-visible={visible}
                                aria-hidden={!visible}
                                inert={!visible || frame.moving}
                                style={{
                                    transform: cardPose(offset, size, radians, radius, top),
                                    opacity: visibility,
                                    zIndex: Math.round(100 - Math.abs(offset) * 10),
                                }}
                            >
                                <div
                                    className={styles.cardContent}
                                    data-card-scroll
                                    aria-hidden={!center}
                                >
                                    <Link
                                        ref={(node) => {
                                            introductionRefs.current[index] = node;
                                        }}
                                        className={styles.introductionLink}
                                        to={category.path}
                                        tabIndex={center ? 0 : -1}
                                        aria-label={t("home.landing.openIntroduction", {
                                            name: nameOf(category),
                                        })}
                                    >

                                        <span className={styles.icon}>
                                            <ServiceIcon id={category.id} />
                                        </span>

                                        <h2>{nameOf(category)}</h2>

                                        <p>
                                            {t(`home.categories.${category.id}.cardDescription`, {
                                                defaultValue: category.description,
                                            })}
                                        </p>
                                    </Link>
                                    <ul className={styles.features}>
                                        {category.children.map((child) => (
                                            <li key={child.path}>
                                                <Link to={child.path} tabIndex={center ? 0 : -1}>
                                                    {t(`home.features.${category.id}.${child.id}`, {
                                                        defaultValue: child.label,
                                                    })}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {!center && (
                                    <button
                                        type="button"
                                        className={styles.sideSelect}
                                        aria-label={t("home.landing.select", {
                                            name: nameOf(category),
                                        })}
                                        tabIndex={visible && !frame.moving ? 0 : -1}
                                        disabled={frame.moving}
                                        onClick={(event) =>
                                            move(offset < 0 ? -1 : 1, event.detail === 0)
                                        }
                                    />
                                )}
                            </article>
                        );
                    })}
                </div>
                <nav
                    className={styles.indicators}
                    aria-label={t("home.landing.indicatorLabel")}
                    onClickCapture={guardClick}
                >
                    {categories.map((category, index) => {
                        const distance = distanceFrom(index, frame.index, categories.length);
                        const offset = distance - 0.5 - frame.progress;
                        const visible = visibilityAt(offset);
                        const center = Math.abs(offset) < 1 && !frame.moving;
                        const angle = (offset * 34 * Math.PI) / 180;
                        return (
                            <button
                                key={category.id}
                                type="button"
                                className={styles.indicator}
                                data-service-id={category.id}
                                data-current={center}
                                data-visible={visible > 0.005}
                                aria-hidden={visible <= 0.005}
                                aria-current={center ? "true" : undefined}
                                aria-label={t("home.landing.select", { name: nameOf(category) })}
                                tabIndex={visible > 0.005 && !frame.moving ? 0 : -1}
                                disabled={frame.moving || center || visible <= 0.005}
                                style={{
                                    opacity: visible,
                                    transform: `translate3d(calc(-50% + ${34 * size.uiScale * Math.sin(angle)}px), ${34 * size.uiScale * (1 - Math.cos(angle))}px, 0)`,
                                    "--dot-size": `${(7 + 3 * Math.max(0, 1.5 - Math.abs(offset))) * size.uiScale}px`,
                                    "--dot-color": `color-mix(in srgb, #226857 ${Math.max(0, Math.min(1, 1.5 - Math.abs(offset))) * 100}%, #b6eada)`,
                                }}
                                onClick={(event) => move(offset < 0 ? -1 : 1, event.detail === 0)}
                            />
                        );
                    })}
                </nav>
                <p className={styles.srOnly} aria-live="polite" aria-atomic="true">
                    {t("home.landing.currentPair", {
                        left: nameOf(categories[frame.index]),
                        right: nameOf(categories[wrap(frame.index + 1, categories.length)]),
                        total: categories.length,
                    })}
                </p>
            </section>
        </div>
    );
}