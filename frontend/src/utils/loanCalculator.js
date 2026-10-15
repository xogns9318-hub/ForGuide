// 입력 검사와 단위 환산 함수 사용
import {
    validateIntegerInput,
    validateRateInput,
} from "./calculatorInput.js";

export const repaymentMethods = [
    {
        // 선택 항목이나 상환 방식을 구분할 값
        value: "equalPayment",
        // 화면에 표시할 이름
        label: "원리금 균등",
        // 기능 또는 계산 방식의 설명
        description:
            "거치 이후 원금과 이자를 합친 납입액을 일정하게 계산합니다. 마지막 회차에는 남은 원금을 정산합니다.",
    },
    {
        // 선택 항목이나 상환 방식을 구분할 값
        value: "equalPrincipal",
        // 화면에 표시할 이름
        label: "원금 균등",
        // 기능 또는 계산 방식의 설명
        description:
            "거치 이후 원금을 나누어 갚고, 남은 원금에 대한 이자를 더합니다.",
    },
    {
        // 선택 항목이나 상환 방식을 구분할 값
        value: "bullet",
        // 화면에 표시할 이름
        label: "만기 일시",
        // 기능 또는 계산 방식의 설명
        description:
            "매월 이자를 납부하고, 전체 대출기간의 마지막 회차에 원금을 갚습니다.",
    },
];

// 공통 계산에서 검사할 입력 항목 지정
const inputKeys = [
    "loanAmount",
    "annualInterestRate",
    "repaymentMonths",
    "graceMonths",
];

// 화면과 다른 기능에서 전달한 입력을 같은 문자열 형태로 정리
function normalizeInput(values) {
    return Object.fromEntries(
        inputKeys.map((key) => [
            key,
            String(values[key] ?? "").trim(),
        ]),
    );
}

// 거치 기간 관계 검증을 화면과 계산 함수에서 함께 사용
export function getGraceError(values) {
    const repayment = String(values.repaymentMonths ?? "");
    const grace = String(values.graceMonths ?? "");

    // 정규식으로 허용한 입력 형식인지 검사
    if (!/^\d+$/.test(repayment) || !/^\d+$/.test(grace)) {
        return "";
    }

    // 사용자가 정한 거치 기간 관계 제한 검사
    if (BigInt(grace) >= BigInt(repayment)) {
        return "거치 기간은 상환 기간보다 짧게 입력해야 합니다.";
    }

    return "";
}

// 버튼 활성 조건과 실제 계산 실행 조건을 동일하게 검사
export function validateLoanInput(values) {
    // 외부 화면에서 전달한 값도 같은 문자열 형식으로 정리
    const input = normalizeInput(values);

    // 필수 입력값 중 빈 항목이 있으면 계산 차단
    if (inputKeys.some((key) => input[key] === "")) {
        return "모든 입력 항목을 입력해주세요.";
    }

    // 각 입력의 형식과 상한을 순서대로 검사
    const messages = [
        validateIntegerInput(input.loanAmount, 999999999999),
        validateRateInput(input.annualInterestRate),
        validateIntegerInput(input.repaymentMonths, 600),
        validateIntegerInput(input.graceMonths, 600),
    ];

    // 검증 결과 중 처음 발견한 오류 선택
    const invalidMessage = messages.find(Boolean);

    // 입력 형식이나 상한 오류를 먼저 반환
    if (invalidMessage) {
        return invalidMessage;
    }

    // 실제 계산의 대출금액은 0보다 큰 값만 허용
    if (BigInt(input.loanAmount) === 0n) {
        return "대출금액은 0보다 커야 합니다.";
    }

    // 실제 계산의 상환 회차는 1개월 이상 필요
    if (BigInt(input.repaymentMonths) === 0n) {
        return "상환 기간은 0보다 커야 합니다.";
    }

    return getGraceError(input);
}

// 원 단위 금액은 큰 정수도 손실 없이 표시
export function formatWon(value) {
    return `${BigInt(value).toLocaleString("ko-KR")}원`;
}

// 추천 상품 상세 등에서도 사용할 수 있는 공통 계산 함수
export function calculateLoan(values, method = "equalPayment") {
    // 검증 함수가 반환한 오류 문구 확인
    const message = validateLoanInput(values);

    // 검증 오류가 있으면 다음 처리를 진행하지 않음
    if (message) {
        throw new Error(message);
    }

    if (!repaymentMethods.some((item) => item.value === method)) {
        throw new Error("상환 방식을 확인해주세요.");
    }

    // 외부 화면에서 전달한 값도 같은 문자열 형식으로 정리
    const input = normalizeInput(values);

    // 만원 입력을 원으로 변환하고 금액 계산은 BigInt로 처리
    const principalWon = BigInt(input.loanAmount) * 10000n;
    // 거치가 끝난 뒤 원금을 상환할 개월 수
    const repaymentMonths = Number(input.repaymentMonths);
    // 원금을 갚지 않고 이자만 납부할 개월 수
    const graceMonths = Number(input.graceMonths);
    // 현재 기준에 따라 상환 기간과 거치 기간 합산
    const totalMonths = repaymentMonths + graceMonths;

    // 연 금리 소수 한 자리를 정수로 변환
    // 예: 2.5% → 25, 월 금리 = 25 / 12000
    const [integerPart, decimalPart = ""] =
        input.annualInterestRate.split(".");

    // 소수 한 자리의 연 금리를 정수 분자로 표현
    const rateNumerator =
        BigInt(integerPart) * 10n + BigInt(decimalPart || "0");

    // 소수 한 자리 연 금리를 월 금리로 바꾸는 분모
    const rateDenominator = 12000n;
    // 정수 계산에 사용할 상환 회차를 BigInt로 변환
    const count = BigInt(repaymentMonths);
    // 원금을 회차 수로 나누고 원 미만은 버림
    const dividedPrincipal = principalWon / count;

    // 원리금균등 방식의 기준 월 납입액 관리
    let fixedPayment = dividedPrincipal;

    // 원리금균등 공식의 월 납입액을 정수 연산으로 계산
    if (method === "equalPayment" && rateNumerator > 0n) {
        // 월 금리를 반영한 거듭제곱의 분자 부분 계산
        const growth =
            (rateDenominator + rateNumerator) ** count;
        // 거듭제곱 계산의 분모 부분 계산
        const base = rateDenominator ** count;

        fixedPayment =
            (principalWon * rateNumerator * growth) /
            (rateDenominator * (growth - base));
    }

    // 원금을 납부하고 남은 대출원금 관리
    let balance = principalWon;
    // 회차별 이자를 누적할 큰 정수 초기화
    let totalInterest = 0n;
    // 가장 큰 회차별 납입액 비교에 사용할 값
    let maximumPayment = 0n;
    // 회차별 원금·이자·납입액·잔금 기록을 모을 배열
    const schedule = [];

    // 매월 원금·이자·잔금을 순서대로 계산
    for (let month = 1; month <= totalMonths; month += 1) {
        // 매월 시작 잔액에 월 금리를 적용하고 원 미만 버림
        const interest =
            (balance * rateNumerator) / rateDenominator;

        // 거치 중에는 0원으로 두고 상환 방식에 따라 원금 결정
        let principal = 0n;

        // 거치가 끝난 회차부터 원금 상환 처리
        if (month > graceMonths) {
            // 마지막 회차에는 남은 원금 전부 납부
            if (month === totalMonths) {
                // 마지막 회차에서 원금 잔액을 전부 정산
                principal = balance;
            } else if (method === "equalPrincipal") {
                principal = dividedPrincipal;
            } else if (method === "equalPayment") {
                principal =
                    fixedPayment > interest
                        ? fixedPayment - interest
                        : 0n;
            }
        }

        // 만기일시는 마지막 회차 전까지 원금 납부가 없음
        if (principal > balance) {
            principal = balance;
        }

        // 이번 회차의 원금과 이자를 더해 납입액 계산
        const payment = principal + interest;

        balance -= principal;
        totalInterest += interest;

        // 현재 납입액이 더 크면 최대값 갱신
        if (payment > maximumPayment) {
            maximumPayment = payment;
        }

        // 회차별 누적 원금과 잔금을 같은 계산 결과에 포함
        schedule.push({
            // 표에 표시할 회차 번호
            month,
            // 거치 회차와 원금 상환 회차 구분
            phase: month <= graceMonths ? "grace" : "repayment",
            // 이번 회차에 납부하는 원금
            principal: principal.toString(),
            // 이번 회차에 납부하는 이자
            interest: interest.toString(),
            // 이번 회차의 원금과 이자 합계
            payment: payment.toString(),
            // 현재 회차까지 납부한 원금 합계
            cumulativePrincipal: (principalWon - balance).toString(),
            // 원금을 납부하고 남은 잔액
            balance: balance.toString(),
        });
    }

    // 대출원금과 누적 이자를 더해 총상환액 계산
    const totalPayment = principalWon + totalInterest;

    return {
        method,
        totalMonths,
        graceMonths,
        repaymentMonths,
        // 대출원금을 원 단위 문자열로 반환
        principalWon: principalWon.toString(),
        // 누적 이자를 원 단위 문자열로 반환
        totalInterest: totalInterest.toString(),
        // 원금과 총이자를 더한 원 단위 문자열 반환
        totalPayment: totalPayment.toString(),
        // 거치 회차를 포함한 실제 첫 회차 납입액
        firstPayment: schedule[0].payment,
        // 거치 종료 후 원금 상환을 시작하는 회차의 납입액
        firstRepaymentPayment: schedule[graceMonths].payment,
        // 총 기간을 기준으로 원 단위 평균 납입액 계산
        averagePayment: (
            totalPayment / BigInt(totalMonths)
        ).toString(),
        // 계산 중 찾은 최대 납입액
        maximumPayment: maximumPayment.toString(),
        schedule,
    };
}

// 같은 입력으로 세 가지 상환 방식의 결과 생성
export function calculateLoanComparison(values) {
    return Object.fromEntries(
        repaymentMethods.map(({ value }) => [
            value,
            calculateLoan(values, value),
        ]),
    );
}