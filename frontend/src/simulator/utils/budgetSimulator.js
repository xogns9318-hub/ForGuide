export const MAX_MONEY = 9_999_999_999_999n;

export const MONEY_FIELDS = [
    "payment",
    "cash",
    "income",
    "fixed",
    "food",
    "living",
];

const DAY = 86_400_000;

// UTC 날짜를 사용해 시간대에 따른 계산 일수 차이를 막는다.
export function readDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

    const [year, month, day] = value.split("-").map(Number);

    if (isYearOutOfRange(year) || month < 1 || month > 12) return null;

    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return {
        year,
        month,
        day,
        ordinal: Math.floor(date.getTime() / DAY),
        monthIndex: year * 12 + month - 1,
    };
}

export function daysInMonth(year, month) {
    if (month === 2) {
        const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        return leap ? 29 : 28;
    }

    return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function monthInfo(index) {
    return {
        year: Math.floor(index / 12),
        month: (index % 12) + 1,
    };
}

export function dateKey(year, month, day) {
    return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
    ].join("-");
}

export function moneyError(value) {
    if (value === "") return "required";
    if (!/^\d+$/.test(value)) return "digits";

    return BigInt(value) > MAX_MONEY ? "amountLimit" : "";
}

function isYearOutOfRange(year) {
    return year < 1900 || year > 2099;
}

export function inputError(values) {
    for (const value of [values.start, values.end]) {
        const year = (value ?? "").split("-", 1)[0];

        if (/^\d{4}$/.test(year) && isYearOutOfRange(Number(year))) {
            return "dateRange";
        }
    }

    for (const field of MONEY_FIELDS) {
        const error = moneyError(values[field] ?? "");
        if (error) return error;
    }

    const start = readDate(values.start ?? "");
    const end = readDate(values.end ?? "");

    if (!start || !end) return "dates";

    return start.ordinal > end.ordinal ? "dateOrder" : "";
}

// 부분 월의 금액은 해당 월의 일수에 비례하며 원 단위에서 반올림한다.
function prorate(amount, days, monthDays) {
    const denominator = BigInt(monthDays);

    return (
        (amount * BigInt(days) * 2n + denominator) /
        (2n * denominator)
    );
}

export function periodAmount(amount, start, end) {
    if (start.monthIndex === end.monthIndex) {
        return prorate(
            amount,
            end.day - start.day + 1,
            daysInMonth(start.year, start.month),
        );
    }

    const firstMonthDays = daysInMonth(start.year, start.month);
    const fullMonths = end.monthIndex - start.monthIndex - 1;

    return (
        prorate(amount, firstMonthDays - start.day + 1, firstMonthDays) +
        amount * BigInt(fullMonths) +
        prorate(amount, end.day, daysInMonth(end.year, end.month))
    );
}

export function calculateBudget(values) {
    const error = inputError(values);
    if (error) throw new Error(error);

    const start = readDate(values.start);
    const end = readDate(values.end);

    const totals = Object.fromEntries(
        MONEY_FIELDS.map((field) => [
            field,
            field === "cash"
                ? BigInt(values[field])
                : periodAmount(BigInt(values[field]), start, end),
        ]),
    );

    const expenses =
        totals.payment + totals.fixed + totals.food + totals.living;

    const balance = totals.cash + totals.income - expenses;

    return {
        start,
        end,
        days: end.ordinal - start.ordinal + 1,
        totals,
        expenses,
        balance,
        available: balance > 0n ? balance : 0n,
        shortfall: balance < 0n ? -balance : 0n,
    };
}

export function allocateBudget(result, specialDays = {}) {
    let specialTotal = 0n;

    for (const [key, value] of Object.entries(specialDays)) {
        const date = readDate(key);

        if (
            !date ||
            date.ordinal < result.start.ordinal ||
            date.ordinal > result.end.ordinal
        ) {
            throw new Error("outside");
        }

        const error = moneyError(String(value));
        if (error) throw new Error(error);

        specialTotal += BigInt(value);
    }

    if (specialTotal > result.available) {
        throw new Error("extraLimit");
    }

    // 큰 지출일 예산을 먼저 확보한 뒤 남은 금액을 전체 날짜에 나눈다.
    const pool = result.available - specialTotal;

    return {
        specialTotal,
        pool,
        daily: pool / BigInt(result.days),
        remainder: pool % BigInt(result.days),
    };
}

export function dayBudget(result, plan, key) {
    const date = readDate(key);

    if (
        !date ||
        date.ordinal < result.start.ordinal ||
        date.ordinal > result.end.ordinal
    ) {
        return null;
    }

    return plan.daily;
}

// 기존 계산기의 만원 입력용 함수와 분리해 원 단위를 환산한다.
export function wonParts(value) {
    if (value === "") return [];

    let rest = BigInt(value);
    const parts = [];

    for (const [size, unit] of [
        [1_000_000_000_000n, "trillion"],
        [100_000_000n, "hundredMillion"],
        [10_000n, "tenThousand"],
        [1n, "won"],
    ]) {
        const count = rest / size;

        if (count) parts.push({ count, unit });

        rest %= size;
    }

    return parts.length ? parts : [{ count: 0n, unit: "won" }];
}