import "../../styles/banner.css";

// 페이지 제목과 설명 표시
export default function Banner({
    title,
    description,
    eyebrow = "ForGuide",
}) {
    return (
        <section className="page-banner">
            {/* 배너 상단 문구 */}
            {eyebrow && (
                <p className="page-banner-eyebrow">{eyebrow}</p>
            )}

            {/* 페이지 제목 */}
            <h1>{title}</h1>

            {/* 페이지 설명 */}
            {description && (
                <p className="page-banner-description">
                    {description}
                </p>
            )}
        </section>
    );
}