import {useTranslation} from "react-i18next";
import {languages} from "../../routes/routeConfig";

export default function LanguageSelector() {
    const { t, i18n } = useTranslation();

    const handleLanguageChange = (event) => {
        const selectedLanguage = event.target.value;

        i18n.changeLanguage(selectedLanguage);
        localStorage.setItem("forguide-language", selectedLanguage);

        if (event.currentTarget.matches(":hover")) {
            event.currentTarget.blur();
        }
    };

    return (
        <label className="header-language">
            <span>{t("header.language")}</span>
        <select
            value={i18n.resolvedLanguage || i18n.language}
            onChange={handleLanguageChange}
        >
            {languages.map((item) => (
                <option key={item.value} value={item.value}>
                    {item.label}
                </option>
            ))}
        </select>
      </label>
    )
}