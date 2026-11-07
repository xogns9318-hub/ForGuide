import { useTranslation } from "react-i18next";
import "../StatusPage/StatusPage.css";

// 예시 데이터와 예시 수치를 구분해 표시
export default function ExampleBadge({ type = "data" }) {
    const { t } = useTranslation();

    return (
        <span className="status-example-badge">
            {t(type === "value" ? "exampleBadge.value" : "exampleBadge.data")}
        </span>
    );
}