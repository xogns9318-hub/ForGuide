// 이름의 첫 글자와 마지막 글자를 제외하고 가리기
export function maskName(value) {
    // 이름을 문자 단위로 나누어 가릴 위치 결정
    const letters = Array.from(String(value ?? "").trim());

    if (letters.length === 0) {
        return "";
    }

    if (letters.length === 1) {
        return "*";
    }

    if (letters.length === 2) {
        return `${letters[0]}*`;
    }

    return `${letters[0]}${"*".repeat(letters.length - 2)}${
        letters[letters.length - 1]
    }`;
}

// 계좌번호의 앞뒤 일부만 표시
export function maskAccount(value) {
    // 계좌번호에서 숫자만 추출해 표시 형식 통일
    const digits = String(value ?? "").replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    // 짧은 값은 전체를 가려 원문 노출 방지
    if (digits.length <= 7) {
        return "*".repeat(digits.length);
    }

    return `${digits.slice(0, 3)}-${"*".repeat(
        digits.length - 6,
    )}-${digits.slice(-3)}`;
}