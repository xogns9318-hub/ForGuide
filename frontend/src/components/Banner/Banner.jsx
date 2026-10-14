// 이 화면에서 사용할 스타일 연결
import "../../styles/banner.css";

// 페이지 제목과 설명 표시
export default function Banner({
    title,
    // 기능 또는 계산 방식의 설명
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