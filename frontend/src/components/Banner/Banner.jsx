import { useLocation } from "react-router-dom";
import "../../styles/banner.css";

// 홈과 카테고리 소개 화면에서만 공통 배너 표시
export default function Banner({ title, description, eyebrow = "ForGuide" }) {
    const { pathname } = useLocation();

    // 홈의 메인 배너는 우선 유지
    const isHomePage = pathname === "/";

    // 카테고리 소개 페이지인지 확인
    const isCategoryPage = pathname.startsWith("/introduction/");

    // 서비스·회원 화면에서는 배너 영역 자체를 만들지 않음
    if (!isHomePage && !isCategoryPage) return null;

    return (
        <section className="page-banner">
            {/* 기존 배너의 상단 문구 유지 */}
            {eyebrow && <p className="page-banner-eyebrow">{eyebrow}</p>}

            {/* 소개 페이지 제목 */}
            <h1>{title}</h1>

            {/* 설명이 있을 때만 표시 */}
            {description && <p className="page-banner-description">{description}</p>}
        </section>
    );
}
