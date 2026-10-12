import "../../styles/statusPage.css";

// 오류가 있는 입력 항목 아래에 안내 표시
export default function FieldError({ id, message }) {
    if (!message) {
        return null;
    }

    return (
        <p id={id} className="status-field-error" role="alert">
            {message}
        </p>
    );
}