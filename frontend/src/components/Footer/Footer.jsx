import { useTranslation } from "react-i18next";
import "../../styles/footer.css";

// 페이지 하단 정보 표시
export default function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                {/* 사이트 소개 */}
                <p>{t("footer.description")}</p>

                {/* 하단 문구 */}
                <p>{t("footer.copyright")}</p>
 
 9           </div>
        </footer>
    );
}