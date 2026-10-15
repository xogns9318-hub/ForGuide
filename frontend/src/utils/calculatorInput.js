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

// 만원 단위 입력을 조·억·만원으로 환산
export function formatAmount(value) {
    // 입력 중인 빈 값은 형식 검사와 환산 표시에서 허용
    if (value === "") {
        return "";
    }

    // 큰 금액의 단위 환산에서도 정밀도 유지
    let amount = BigInt(value);
    // 0이 아닌 금액 단위만 모아 환산 문구 생성
    const parts = [];

    // 조·억·만원의 큰 단위부터 순서대로 환산
    for (const [unit, label] of [
        [100000000n, "조"],
        [10000n, "억"],
        [1n, "만원"],
    ]) {
        // 현재 단위로 표현할 수 있는 금액의 몫 계산
        const count = amount / unit;

        // 0이 아닌 단위만 환산 문구에 포함
        if (count > 0n) {
            parts.push(`${count}${label}`);
        }

        // 이미 표시한 큰 단위를 제외하고 나머지 금액 계산
        amount %= unit;
    }

    return parts.join("") || "0만원";
}

// 개월을 년·개월로 환산
export function formatMonths(value) {
    // 입력 중인 빈 값은 형식 검사와 환산 표시에서 허용
    if (value === "") {
        return "";
    }

    // 입력한 개월 수를 숫자로 변환
    const months = Number(value);
    // 12개월 단위의 완전한 연수 계산
    const years = Math.floor(months / 12);
    // 연 단위로 바꾸고 남은 개월 수 계산
    const remainingMonths = months % 12;

    return (
        `${years ? `${years}년` : ""}${
            remainingMonths ? `${remainingMonths}개월` : ""
        }` || "0개월"
    );
}