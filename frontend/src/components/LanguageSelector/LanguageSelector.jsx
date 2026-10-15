// 화면 상태와 생명주기를 관리하는 React 기능 사용
import { useId } from "react";
import { useTranslation } from "react-i18next";
// 메뉴 이름과 주소를 공통 경로 설정에서 사용
import { languages } from "../../routes/routeConfig";
import SelectBox from "../SelectBox/SelectBox.jsx";

export default function LanguageSelector() {
    const { t, i18n } = useTranslation();
    // 언어 제목과 공통 선택창을 연결할 고유 식별자 생성
    const selectorId = useId();

    const language =
        i18n.resolvedLanguage || i18n.language || "ko";

    function handleLanguageChange(selectedLanguage) {
        // 선택한 언어를 화면과 다음 방문의 저장값에 반영
        i18n.changeLanguage(selectedLanguage);
        localStorage.setItem(
            "forguide-language",
            selectedLanguage,
        );
    }

    return (
        <div className="header-language">
            <span id={`${selectorId}-label`} className="header-language-label">
                {t("header.language")}
            </span>

            {/* 선택값·목록·변경 함수를 공통 선택창에 전달 */}
            <SelectBox
                id={`${selectorId}-select`}
                labelledBy={`${selectorId}-label`}
                value={language}
                options={languages}
                onChange={handleLanguageChange}
                compact
            />
        </div>
    );
}