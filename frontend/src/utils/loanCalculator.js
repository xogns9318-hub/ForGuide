import {
    validateIntegerInput,
    validateRateInput,
} from "./calculatorInput.js";

// 입력 선택창과 결과 제목에서 같은 이름과 순서를 사용
export const repaymentMethods = [
    { value: "bullet", label: "만기 일시" },
    { value: "equalPayment", label: "원리금 균등" },
    { value: "equalPrincipal", label: "원금 균등" },
];

// 입력값을 문자열로 통일하고 만기일시의 거치는 항상 0으로 처리
function normalizeInput(values, method) {
    return {
        loanAmount: String(values.loanAmount ?? "").trim(),
        annualInterestRate: String(
            values.annualInterestRate ?? "",
        ).trim(),
        loanMonths: String(values.loanMonths ?? "").trim(),
        graceMonths:
            method === "bullet"
                ? "0"
                : String(values.graceMonths ?? "0").trim(),
    };
}

// 거치 기간은 전체 대출 기간보다 짧아야 함
export function getGraceError(values, method = "bullet") {
    if (method === "bullet") return "";

    const months = String(values.loanMonths ?? "");
    const grace = String(values.graceMonths ?? "0");

    // 입력 중인 빈 값은 다른 필수값 검사에서 처리
    if (!/^\d+$/.test(months) || !/^\d+$/.test(grace)) {
        return "";
    }

    return BigInt(grace) >= BigInt(months)
        ? "거치 기간은 대출 기간보다 짧게 입력해야 합니다."
        : "";
}

// 버튼 활성 조건과 실제 계산에서 같은 검증 사용
export function validateLoanInput(values, method = "bullet") {
    // 등록된 상환 방식인지 확인
    if (!repaymentMethods.some((item) => item.value === method)) {
        return "상환 방식을 확인해주세요.";
    }

    const input = normalizeInput(values, method);

    // 빈 값은 계산할 수 없음
    if (Object.values(input).some((value) => value === "")) {
        return "모든 입력 항목을 입력해주세요.";
    }

    // 기존 금액·금리 제한을 유지하고 전체 기간을 600개월로 제한
    const error = [
        validateIntegerInput(input.loanAmount, 999999999999),
        validateRateInput(input.annualInterestRate),
        validateIntegerInput(input.loanMonths, 600),
        validateIntegerInput(input.graceMonths, 600),
    ].find(Boolean);

    if (error) return error;

    // 금리와 거치는 0을 허용하지만 대출 금액과 기간은 양수여야 함
    if (BigInt(input.loanAmount) === 0n) {
        return "대출 금액은 0보다 커야 합니다.";
    }

    if (BigInt(input.loanMonths) === 0n) {
        return "대출 기간은 0보다 커야 합니다.";
    }

    return getGraceError(input, method);
}

// 큰 금액도 정밀도를 잃지 않고 원 단위로 표시
export function formatWon(value) {
    return BigInt(value).toLocaleString("ko-KR") + "원";
}

// 실제 계산 결과의 거치 여부에 맞춰 설명 선택
export function getRepaymentDescription(result) {
    if (result.method === "bullet") {
        return "대출 만기까지 이자만 납부하고, 원금은 만기에 지불하는 방식입니다.";
    }

    // 거치가 없는 총 이자 계산기에서는 거치 설명을 붙이지 않음
    const prefix =
        result.graceMonths > 0
            ? "거치기간에는 이자만 납부하고, 이후에는 "
            : "";

    return prefix + (
        result.method === "equalPayment"
            ? "원금과 이자를 합쳐 매달 동일한 금액을 납부하는 방식입니다."
            : "매달 동일한 원금을 갚으며 이자는 점차 줄어드는 방식입니다."
    );
}

// 두 계산기와 다른 기능에서 함께 사용할 공통 계산 함수
export function calculateLoan(values, method = "bullet") {
    // 선택한 상환 방식과 입력값을 함께 검사
    const message = validateLoanInput(values, method);
    if (message) throw new Error(message);

    const input = normalizeInput(values, method);

    // 입력 단위인 만원을 실제 계산 단위인 원으로 변환
    const principalWon = BigInt(input.loanAmount) * 10000n;

    // 전체 대출 기간에서 거치를 제외한 회차에 원금 상환
    const totalMonths = Number(input.loanMonths);
    const graceMonths = Number(input.graceMonths);
    const repaymentMonths = totalMonths - graceMonths;
    const count = BigInt(repaymentMonths);

    // 소수 한 자리 연 금리를 정수 비율의 월 금리로 변환
    // 예: 연 2.4%는 월 24 / 12000
    const [integerPart, decimalPart = ""] =
        input.annualInterestRate.split(".");

    const rateNumerator =
        BigInt(integerPart) * 10n + BigInt(decimalPart || "0");
    const rateDenominator = 12000n;

    // 원금균등과 무이자 계산에서 사용할 기준 원금
    const dividedPrincipal = principalWon / count;
    let fixedPayment = dividedPrincipal;

    // 원리금균등의 기준 납입액을 원 단위 정수로 계산
    if (method === "equalPayment" && rateNumerator > 0n) {
        const growth =
            (rateDenominator + rateNumerator) ** count;
        const base = rateDenominator ** count;

        fixedPayment =
            (principalWon * rateNumerator * growth) /
            (rateDenominator * (growth - base));
    }

    // 월별 잔금·누적 이자·최대 납입액 관리
    let balance = principalWon;
    let totalInterest = 0n;
    let maximumPayment = 0n;
    const schedule = [];

    // 전체 대출 기간만큼 월별 내역 생성
    for (let month = 1; month <= totalMonths; month += 1) {
        // 해당 회차 시작 잔금에 월 금리를 적용하고 원 미만 버림
        const interest =
            (balance * rateNumerator) / rateDenominator;

        let principal = 0n;

        // 거치 중에는 원금 0, 종료 후에는 선택한 방식으로 계산
        if (month > graceMonths) {
            if (month === totalMonths) {
                // 마지막 회차에서 남은 원금을 정산하여 잔금 0 보장
                principal = balance;
            } else if (method === "equalPrincipal") {
                principal = dividedPrincipal;
            } else if (method === "equalPayment") {
                principal =
                    fixedPayment > interest
                        ? fixedPayment - interest
                        : 0n;
            }

            // 만기일시는 마지막 회차 전까지 원금 0 유지
        }

        // 남은 원금보다 많이 차감하지 않도록 제한
        if (principal > balance) {
            principal = balance;
        }

        // 해당 회차의 실제 납입액과 누적값 계산
        const payment = principal + interest;
        balance -= principal;
        totalInterest += interest;

        if (payment > maximumPayment) {
            maximumPayment = payment;
        }

        // 정확한 금액은 원 단위 문자열로 반환
        schedule.push({
            month,
            phase:
                month <= graceMonths ? "grace" : "repayment",
            principal: principal.toString(),
            interest: interest.toString(),
            payment: payment.toString(),
            cumulativePrincipal:
                (principalWon - balance).toString(),
            balance: balance.toString(),
        });
    }

    // 총상환액은 원금과 전체 이자의 합계
    const totalPayment = principalWon + totalInterest;

    return {
        method,
        totalMonths,
        graceMonths,
        repaymentMonths,
        principalWon: principalWon.toString(),
        totalInterest: totalInterest.toString(),
        totalPayment: totalPayment.toString(),

        // 실제 첫 회차 금액이며 거치가 있으면 이자만 포함
        firstPayment: schedule[0].payment,

        // 거치 종료 후 원금 상환을 시작하는 회차의 금액
        firstRepaymentPayment: schedule[graceMonths].payment,

        // 만기일시의 정기 납입액에는 원금을 제외한 월 이자 사용
        regularPayment:
            method === "bullet"
                ? schedule[0].interest
                : schedule[graceMonths].payment,

        // 평균은 전체 대출 기간 기준이며 원 미만 버림
        averagePayment: (
            totalPayment / BigInt(totalMonths)
        ).toString(),

        maximumPayment: maximumPayment.toString(),
        schedule,
    };
}

// 이후 비교 기능에서도 같은 계산 함수를 재사용할 수 있도록 유지
export function calculateLoanComparison(values) {
    return Object.fromEntries(
        repaymentMethods.map(({ value }) => [
            value,
            calculateLoan(values, value),
        ]),
    );
}