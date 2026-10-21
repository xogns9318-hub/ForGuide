import { useId, useState } from "react";
import SelectBox from "../SelectBox/SelectBox.jsx";
import {
    validateIntegerInput,
    validateRateInput,
    formatAmount,
    formatMonths,
} from "../../utils/calculatorInput.js";
import {
    calculateLoan,
    getGraceError,
    validateLoanInput,
    repaymentMethods,
} from "../../utils/loanCalculator.js";
import {
    LoanResults,
    LoanChart,
    LoanSchedule,
} from "./LoanResults.jsx";
import "../../styles/monthlyPayment.css";

// 숫자 입력의 이름·단위·상한을 한 곳에서 관리
const numericFields = [
    {
        name: "loanAmount",
        label: "대출 금액",
        unit: "만원",
        maximum: 999999999999,
    },
    {
        name: "annualInterestRate",
        label: "연 금리",
        unit: "%",
    },
    {
        name: "loanMonths",
        label: "대출 기간",
        unit: "개월",
        maximum: 600,
    },
    {
        name: "graceMonths",
        label: "거치 기간",
        unit: "개월",
        maximum: 600,
    },
];

export default function LoanCalculator({ mode = "monthly" }) {
    // 여러 계산기의 입력 식별자가 겹치지 않도록 생성
    const formId = useId();
    const isInterestPage = mode === "interest";

    // 상환 방식의 기본 선택은 만기일시
    const [method, setMethod] = useState("bullet");

    // 빈 값과 소수점 입력 중 상태를 보존하기 위해 문자열 사용
    const [values, setValues] = useState({
        loanAmount: "",
        annualInterestRate: "",
        loanMonths: "",
        graceMonths: "0",
    });

    // 계산하기를 누르기 전에는 결과를 표시하지 않음
    const [result, setResult] = useState(null);
    const [calculationError, setCalculationError] = useState("");

    // 월 상환액의 분할상환 방식에서만 거치 입력 표시
    const showGrace = !isInterestPage && method !== "bullet";

    const visibleFields = numericFields.filter(
        (field) => field.name !== "graceMonths" || showGrace,
    );

    // 숨긴 거치 값은 검증과 계산 양쪽에서 반드시 0으로 처리
    const calculationInput = {
        ...values,
        graceMonths: showGrace ? values.graceMonths : "0",
    };

    // 버튼과 실제 계산에서 동일한 입력 검증 사용
    const graceError = getGraceError(calculationInput, method);
    const canCalculate =
        validateLoanInput(calculationInput, method) === "";

    function handleMethodChange(value) {
        setMethod(value);

        // 만기일시로 바꾸면 이전 거치 값도 초기화
        if (value === "bullet") {
            setValues((previous) => ({
                ...previous,
                graceMonths: "0",
            }));
        }

        // 변경한 조건은 계산하기를 눌렀을 때 표시
        setResult(null);
        setCalculationError("");
    }

    function handleInputChange(field, nextValue) {
        // 013처럼 입력하면 앞자리 0을 제거하여 13으로 표시
        const value = nextValue.replace(/^0+(?=\d)/, "");

        const error =
            field.name === "annualInterestRate"
                ? validateRateInput(value)
                : validateIntegerInput(value, field.maximum);

        // 기존 형식과 상한을 벗어나는 입력은 반영하지 않음
        if (error) return;

        setValues((previous) => ({
            ...previous,
            [field.name]: value,
        }));

        setResult(null);
        setCalculationError("");
    }

    function handleInputBlur(name) {
        // 입력을 마치면 2. 같은 표시를 2로 정리
        setValues((previous) => ({
            ...previous,
            [name]:
                previous[name] === ""
                    ? ""
                    : String(Number(previous[name])),
        }));
    }

    function getConvertedText(name) {
        // 금액과 기간은 기존 환산 함수를 그대로 사용
        if (name === "loanAmount") {
            return formatAmount(values[name]);
        }

        if (name === "loanMonths" || name === "graceMonths") {
            return formatMonths(values[name]);
        }

        return "";
    }

    function handleCalculate(event) {
        // 계산 버튼을 눌러도 페이지가 새로고침되지 않도록 처리
        event.preventDefault();

        if (!canCalculate) return;

        try {
            // 두 계산기 모두 선택한 방식 하나를 같은 함수로 계산
            setResult(calculateLoan(calculationInput, method));
            setCalculationError("");
        } catch (error) {
            setResult(null);
            setCalculationError(
                error instanceof Error
                    ? error.message
                    : "계산하지 못했습니다. 입력을 확인해주세요.",
            );
        }
    }

    return (
        <section
            className="panel monthly-payment"
            aria-labelledby={formId + "-title"}
        >
            <div className="monthly-payment-layout">
                {/* 왼쪽 위: 기존 설명 없이 제목과 입력만 표시 */}
                <div className="loan-input-column">
                    <h2
                        id={formId + "-title"}
                        className="loan-calculator-title"
                    >
                        {isInterestPage
                            ? "총 이자"
                            : "월 상환액"}
                    </h2>

                    <form
                        className="monthly-payment-fields"
                        onSubmit={handleCalculate}
                        noValidate
                    >
                        {/* 상환 방식 선택창은 입력 영역 맨 위에 배치 */}
                        <div className="form-field loan-method-field">
                            <span id={formId + "-method-label"}>
                                상환 방식
                            </span>
                            <SelectBox
                                id={formId + "-method"}
                                labelledBy={formId + "-method-label"}
                                value={method}
                                options={repaymentMethods}
                                onChange={handleMethodChange}
                            />
                        </div>

                        {/* 모드와 상환 방식에 맞는 숫자 입력만 표시 */}
                        {visibleFields.map((field) => {
                            const inputId =
                                formId + "-" + field.name;
                            const helpId = inputId + "-help";
                            const convertedText =
                                getConvertedText(field.name);
                            const warning =
                                field.name === "graceMonths"
                                    ? graceError
                                    : "";

                            return (
                                <div
                                    key={field.name}
                                    className="monthly-number-field"
                                >
                                    <label htmlFor={inputId}>
                                        {field.label}
                                    </label>

                                    <div className="monthly-number-line">
                                        <input
                                            id={inputId}
                                            name={field.name}
                                            type="text"
                                            inputMode={
                                                field.name === "annualInterestRate"
                                                    ? "decimal"
                                                    : "numeric"
                                            }
                                            autoComplete="off"
                                            value={values[field.name]}
                                            aria-invalid={
                                                warning ? true : undefined
                                            }
                                            aria-describedby={
                                                warning || convertedText
                                                    ? helpId
                                                    : undefined
                                            }
                                            onChange={(event) =>
                                                handleInputChange(
                                                    field,
                                                    event.target.value,
                                                )
                                            }
                                            onBlur={() =>
                                                handleInputBlur(field.name)
                                            }
                                        />

                                        <span className="monthly-input-unit">
                                            {field.unit}
                                        </span>
                                    </div>

                                    {/* 거치 관계 오류는 기간 환산 문구 대신 표시 */}
                                    {warning ? (
                                        <p
                                            id={helpId}
                                            className="monthly-input-error"
                                            role="alert"
                                        >
                                            {warning}
                                        </p>
                                    ) : convertedText ? (
                                        <p
                                            id={helpId}
                                            className="monthly-converted-value"
                                        >
                                            {convertedText}
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}

                        {/* 실제 계산 실패가 있을 때만 오류 표시 */}
                        {calculationError && (
                            <p
                                className="monthly-input-error"
                                role="alert"
                            >
                                {calculationError}
                            </p>
                        )}

                        {/* 필수값과 기간 관계가 올바를 때만 계산 가능 */}
                        <button
                            type="submit"
                            className="button button-primary monthly-payment-button"
                            disabled={!canCalculate}
                        >
                            계산하기
                        </button>
                    </form>
                </div>

                {/* 오른쪽: 결과 제목과 요약 바로 아래에 스케줄 연결 */}
                <div className="loan-result-slot">
                    <div className="loan-result-stack">
                        <LoanResults mode={mode} result={result} />

                        <LoanSchedule
                            mode={mode}
                            result={result}
                            scheduleId={formId + "-schedule"}
                        />
                    </div>
                </div>

                {/* 왼쪽 아래: 월별 상환금 하나만 선으로 표시 */}
                <LoanChart
                    result={result}
                    chartId={formId + "-chart"}
                />
            </div>
        </section>
    );
}