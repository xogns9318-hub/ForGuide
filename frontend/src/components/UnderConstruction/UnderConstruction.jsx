import { useId } from "react";
import { useTranslation } from "react-i18next";
import styles from "../../styles/underConstruction.module.css";

// 미구현 서비스에서 공통으로 사용하는 제작 중 화면
export default function UnderConstruction() {
    const { t } = useTranslation();
    const titleId = useId();

    return (
        <section className={styles.page} aria-labelledby={titleId}>
            {/* 직접 그린 정면 픽셀 오리 */}
            <svg
                className={styles.duck}
                viewBox="0 0 40 48"
                shapeRendering="crispEdges"
                role="img"
                aria-label={t("underConstruction.duckLabel")}
                focusable="false"
            >
                {/* 바닥 그림자 */}
                <path fill="#DCEBE5" d="M10 44h20v2H10z" />

                {/* 발은 움직이지 않고 바닥에 고정 */}
                <g fill="#58462D">
                    <path d="M12 38h6v2h2v4H10v-4h2z" />
                    <path d="M22 38h6v2h2v4H20v-4h2z" />
                </g>
                <g fill="#EE9B37">
                    <path d="M12 40h6v2h-6z" />
                    <path d="M22 40h6v2h-6z" />
                </g>

                {/* 고개를 숙일 때 몸통도 조금 따라 움직임 */}
                <g className={styles.body}>
                    <path
                        fill="#58462D"
                        d="M14 21h12v2h3v4h2v8h-2v4h-3v2H14v-2h-3v-4H9v-8h2v-4h3z"
                    />

                    {/* 몸통은 은은한 흰색으로 표시 */}
                    <path
                        fill="#F7FAF9"
                        d="M14 23h12v2h2v4h1v6h-2v3h-3v1h-8v-1h-3v-3h-2v-6h1v-4h2z"
                    />
                    <path
                        fill="#FFFFFF"
                        d="M16 28h8v2h2v7h-2v2h-8v-2h-2v-7h2z"
                    />

                    {/* 두 날개를 배 앞에 모은 모습 */}
                    <path
                        fill="#58462D"
                        d="M11 27h3v2h2v2h3v2h2v4h-5v-2h-3v-3h-2z"
                    />
                    <path
                        fill="#58462D"
                        d="M29 27h-3v2h-2v2h-3v2h-2v4h5v-2h3v-3h2z"
                    />

                    {/* 흰 날개는 연한 회색으로 입체감 표시 */}
                    <path
                        fill="#E9EFEC"
                        d="M12 29h2v2h2v2h3v2h-3v-2h-2v-2h-2z"
                    />
                    <path
                        fill="#E9EFEC"
                        d="M28 29h-2v2h-2v2h-3v2h3v-2h2v-2h2z"
                    />
                </g>

                {/* 목 부근을 기준으로 들었다 숙이는 머리 */}
                <g className={styles.head}>
                    {/* 머리 위 작은 흰색 깃털 */}
                    <path
                        fill="#58462D"
                        d="M18 2h4v2h2v4h-8V4h2z"
                    />
                    <path fill="#F7FAF9" d="M18 4h4v4h-4z" />

                    {/* 머리 외곽선과 흰색 얼굴 */}
                    <path
                        fill="#58462D"
                        d="M16 6h8v2h4v2h2v4h2v9h-2v3h-4v2H14v-2h-4v-3H8v-9h2v-4h2V8h4z"
                    />
                    <path
                        fill="#FFFFFF"
                        d="M16 8h8v2h4v4h2v9h-2v2h-4v1h-8v-1h-4v-2h-2v-9h2v-4h4z"
                    />

                    {/* 머리의 밝은 부분과 연한 회색 그림자 */}
                    <path
                        fill="#FFFFFF"
                        d="M14 10h10v2H14z M12 12h2v4h-2z"
                    />
                    <path
                        fill="#DDE6E2"
                        d="M28 16h2v7h-2v2h-4v1h-8v-1h10v-2h2z"
                    />

                    {/* 고개를 들었을 때의 눈과 주황색 부리 */}
                    <g className={styles.faceUp}>
                        <path
                            fill="#58462D"
                            d="M13 16h3v4h-3z M24 16h3v4h-3z"
                        />
                        <path
                            fill="#FFFFFF"
                            d="M14 16h1v1h-1z M25 16h1v1h-1z"
                        />
                        <path
                            fill="#F0AA80"
                            d="M11 21h4v2h-4z M25 21h4v2h-4z"
                        />
                        <path
                            fill="#58462D"
                            d="M16 21h8v2h3v4h-3v2h-8v-2h-3v-4h3z"
                        />
                        <path
                            fill="#F5A13A"
                            d="M16 23h8v2h-8z M15 25h10v2H15z"
                        />
                        <path fill="#FFD275" d="M17 23h6v1h-6z" />
                    </g>

                    {/* 숙였을 때는 눈을 감은 표정으로 교체 */}
                    <g className={styles.faceDown}>
                        <path
                            fill="#58462D"
                            d="M12 18h2v2h3v-2h2v4h-7z M21 18h2v2h3v-2h2v4h-7z"
                        />
                        <path
                            fill="#F0AA80"
                            d="M11 23h4v2h-4z M25 23h4v2h-4z"
                        />
                        <path
                            fill="#58462D"
                            d="M16 23h8v2h2v3h-2v2h-8v-2h-2v-3h2z"
                        />
                        <path fill="#F5A13A" d="M16 25h8v3h-8z" />
                    </g>
                </g>
            </svg>

            {/* 요청한 문구를 두 줄로 표시 */}
            <div className={styles.message}>
                <h1 id={titleId} className={styles.title}>
                    {t("underConstruction.title")}
                </h1>
                <p className={styles.description}>
                    {t("underConstruction.description")}
                </p>
            </div>
        </section>
    );
}