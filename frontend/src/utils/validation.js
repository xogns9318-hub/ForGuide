// 입력 항목마다 전달받은 기준으로 문자열 검증
export function validateText(
    value,
    { required = false, minLength, maxLength } = {},
) {
    // 앞뒤 공백을 제거하고 문자열이 아닌 값은 빈 값으로 처리
    const text = typeof value === "string" ? value.trim() : "";

    // 필수 항목의 빈 문자열 검사
    if (required && !text) {
        return "필수 입력 항목입니다.";
    }

    // 선택 항목의 빈 값은 길이 검사에서 제외
    if (!text) {
        return "";
    }

    // 문자를 배열로 세어 문자열 길이 확인
    const length = Array.from(text).length;

    if (minLength !== undefined && length < minLength) {
        return `${minLength}자 이상 입력해주세요.`;
    }

    if (maxLength !== undefined && length > maxLength) {
        return `${maxLength}자 이하로 입력해주세요.`;
    }

    return "";
}