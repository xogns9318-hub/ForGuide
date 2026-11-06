// 빈 값은 입력 중인 상태로 허용하고 정수 범위 검사
export function validateIntegerInput(value, maximum) {
    // 입력 중인 빈 값은 형식 검사와 환산 표시에서 허용
    if (value === "") {
        return "";
    }

    // 정규식으로 허용한 입력 형식인지 검사
    if (!/^\d+$/.test(value)) {
        return "0 이상의 정수만 입력해주세요.";
    }

    // 큰 정수의 정밀도를 유지한 상태로 입력 상한 비교
    if (BigInt(value) > BigInt(maximum)) {
        return `${maximum.toLocaleString("ko-KR")} 이하로 입력해주세요.`;
    }

    return "";
}

// 연 금리는 입력 중인 소수점과 소수 한 자리까지 허용
export function validateRateInput(value) {
    // 입력 중인 빈 값은 형식 검사와 환산 표시에서 허용
    if (value === "") {
        return "";
    }

    // 정규식으로 허용한 입력 형식인지 검사
    if (!/^\d+(?:\.\d?)?$/.test(value)) {
        return "0 이상의 숫자를 소수점 한 자리까지 입력해주세요.";
    }

    // 사용자가 지정한 금리 입력 상한 검사
    if (Number(value) > 20) {
        return "20% 이하로 입력해주세요.";
    }

    return "";
}