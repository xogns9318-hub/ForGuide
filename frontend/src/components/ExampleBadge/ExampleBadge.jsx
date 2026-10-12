import "../../styles/statusPage.css";

// 예시 데이터와 예시 수치를 구분해 표시
export default function ExampleBadge({ type = "data" }) {
    return (
        <span className="status-example-badge">
            {type === "value" ? "예시값" : "예시 데이터"}
        </span>
    );
}