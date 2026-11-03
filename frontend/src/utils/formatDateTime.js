// 서버의 LocalDateTime 값을 현재 선택 언어 형식으로 표시한다.
export function formatDateTime(value, language) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(language, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}