import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { categories, contactRoutes } from "../../routes/routeConfig.js";
import styles from "./ChatbotMessageText.module.css";

// 답변에 나올 수 있는 화면 주소 → 메뉴 이름 키. 헤더 메뉴와 같은 키를 써서 이름이 메뉴와 똑같이 보인다.
const SCREEN_LABEL_KEYS = new Map([
    ...categories.flatMap((category) =>
        category.children.map((child) => [child.path, `home.features.${category.id}.${child.id}`]),
    ),
    ...contactRoutes.map((route) => [route.path, route.labelKey]),
    ["/mypage", "header.myPage"],
]);

// 프롬프트는 [/service/loan]처럼 대괄호로 쓰게 한다. 예전 답변처럼 괄호 없이 온 주소도 함께 찾는다.
const INTERNAL_PATH = /\[?(\/(?:service|contact|mypage)(?:\/[A-Za-z0-9-]+)*)\]?/g;

export default function ChatbotMessageText({ text, linkPaths = false }) {
    const { t } = useTranslation();

    if (!linkPaths) {
        return text;
    }

    // split에 묶음 괄호가 있어 주소(괄호 뺀 부분)는 홀수 번째에 들어온다
    return text.split(INTERNAL_PATH).map((part, index) => {
        if (index % 2 === 0) {
            return part;
        }

        const labelKey = SCREEN_LABEL_KEYS.get(part);

        // 메뉴에 없는 주소(모델이 지어낸 주소)는 이동 버튼을 만들지 않고 글자로 둔다
        if (!labelKey) {
            return part;
        }

        return (
            <Link key={index} to={part} className={styles.screenLink}>
                {t(labelKey)}
            </Link>
        );
    });
}
