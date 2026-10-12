import "../../styles/footer.css";
import { useTranslation } from "react-i18next";

export default function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                {/* 사이트 소개 */}
                <p>{t("footer.description")}</p>
                <p>{t("footer.copyright")}</p>
            </div>
        </footer>
    );
}