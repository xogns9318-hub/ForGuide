function getLocale(language) {
    const locales = {
        ko: "ko-KR",
        en: "en-US",
        ja: "ja-JP",
        zh: "zh-CN",
        vi: "vi-VN",
        th: "th-TH",
    };

    return locales[language] || "en-US";
}

function isKorean(language) {
    return language === "ko";
}

// 계산 결과의 실제 원화 금액을 현재 언어 형식으로 표시한다.
export function formatKrw(value, language = "ko") {
    const amount = BigInt(value);

    // 한국어 화면의 기존 원화 표기는 유지한다.
    if (isKorean(language)) {
        return `${amount.toLocaleString("ko-KR")}원`;
    }

    return new Intl.NumberFormat(getLocale(language), {
        style: "currency",
        currency: "KRW",
        currencyDisplay: "code",
        maximumFractionDigits: 0,
    }).format(amount);
}

// 한국어 입력 화면에서만 기존 만원 표시를 유지한다.
function formatKoreanLoanAmount(amount) {
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

// 입력값은 항상 만원 단위지만, 외국어 화면에는 실제 KRW 금액으로 보여준다.
export function formatLoanAmount(value, language = "ko") {
    if (value === "") {
        return "";
    }

    const amountInTenThousandWon = BigInt(value);

    if (isKorean(language)) {
        return formatKoreanLoanAmount(amountInTenThousandWon);
    }

    return formatKrw(amountInTenThousandWon * 10000n, language);
}

// 개월 수를 현재 언어에 맞는 년,개월 표기로 바꾼다.
export function formatLoanMonths(value, language = "ko") {
    if (value === "") {
        return "";
    }

    const months = Number(value);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (isKorean(language)) {
        return (
            `${years ? `${years}년` : ""}${
                remainingMonths ? `${remainingMonths}개월` : ""
            }` || "0개월"
        );
    }

    const yearFormatter = new Intl.NumberFormat(getLocale(language), {
        style: "unit",
        unit: "year",
        unitDisplay: "long",
    });

    const monthFormatter = new Intl.NumberFormat(getLocale(language), {
        style: "unit",
        unit: "month",
        unitDisplay: "long",
    });

    const parts = [];

    if (years > 0) {
        parts.push(yearFormatter.format(years));
    }

    if (remainingMonths > 0) {
        parts.push(monthFormatter.format(remainingMonths));
    }

    return parts.join(" ") || monthFormatter.format(0);
}