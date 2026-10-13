// 입력 항목마다 전달받은 기준으로 문자열 검증
export function validateText(
    value,
    { required = false, minLength, maxLength } = {},
) {
    const text = typeof value === "string" ? value.trim() : "";

    if (required && !text) {
        return "필수 입력 항목입니다.";
    }

    // 선택 항목의 빈 값은 길이 검사에서 제외
    if (!text) {
        return "";
    }

    const length = Array.from(text).length;

    if (minLength !== undefined && length < minLength) {
        return `${minLength}자 이상 입력해주세요.`;
    }

    if (maxLength !== undefined && length > maxLength) {
        return `${maxLength}자 이하로 입력해주세요.`;
    }

    return "";
}