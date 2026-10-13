// 빈 값은 입력 중인 상태로 허용하고 정수 범위 검사
export function validateIntegerInput(value, maximum) {
    if (value === "") {
        return "";
    }

    if (!/^\d+$/.test(value)) {
        return "0 이상의 정수만 입력해주세요.";
    }

    if (BigInt(value) > BigInt(maximum)) {
        return `${maximum.toLocaleString("ko-KR")} 이하로 입력해주세요.`;
    }

    return "";
}

// 연 금리는 입력 중인 소수점과 소수 한 자리까지 허용
export function validateRateInput(value) {
    if (value === "") {
        return "";
    }

    if (!/^\d+(?:\.\d?)?$/.test(value)) {
        return "0 이상의 숫자를 소수점 한 자리까지 입력해주세요.";
    }

    if (Number(value) > 20) {
        return "20% 이하로 입력해주세요.";
    }

    return "";
}

// 만원 단위 입력을 조·억·만원으로 환산
export function formatAmount(value) {
    if (value === "") {
        return "";
    }

    let amount = BigInt(value);
    const parts = [];

    for (const [unit, label] of [
        [100000000n, "조"],
        [10000n, "억"],
        [1n, "만원"],
    ]) {
        const count = amount / unit;

        if (count > 0n) {
            parts.push(`${count}${label}`);
        }

        amount %= unit;
    }

    return parts.join("") || "0만원";
}

// 개월을 년·개월로 환산
export function formatMonths(value) {
    if (value === "") {
        return "";
    }

    const months = Number(value);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    return (
        `${years ? `${years}년` : ""}${
            remainingMonths ? `${remainingMonths}개월` : ""
        }` || "0개월"
    );
}