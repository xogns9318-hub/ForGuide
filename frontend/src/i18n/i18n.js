// 다국어 번역 기능을 관리하는 i18next 라이브러리
import i18n from "i18next";

// React 컴포넌트에서 i18next를 사용할 수 있도록 연결
import { initReactI18next } from "react-i18next";

// 언어별 번역 데이터 가져오기
import ko from "./locales/ko";
import en from "./locales/en";
import zh from "./locales/zh";
import vi from "./locales/vi";
import ja from "./locales/ja";
import th from "./locales/th";

const supportedLanguages = ["ko", "en", "zh", "ja", "vi", "th"];

const savedLanguage = localStorage.getItem("forguide-language");

const initialLanguage = supportedLanguages.includes(savedLanguage)
    ? savedLanguage
    : "ko";

i18n.use(initReactI18next).init({
    // 언어별 번역 데이터 등록
    resources: {
        ko: { translation: ko },
        en: { translation: en },
        zh: { translation: zh },
        vi: { translation: vi },
        ja: { translation: ja },
        th: { translation: th },
    },

    lng: initialLanguage,
    fallbackLng: "ko",
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;