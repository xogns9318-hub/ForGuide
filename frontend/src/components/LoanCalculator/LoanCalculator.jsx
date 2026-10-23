import { useEffect, useId, useState } from "react";
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
import { LoanResults, LoanChart, LoanSchedule } from "./LoanResults.jsx";
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
    // 계산할 때마다 그래프를 새로 그리기 위한 번호를 관리한다.
    const [chartVersion, setChartVersion] = useState(0);
    // 첫 계산 전에는 입력창만 가운데에 표시한다.
    const [hasCalculated, setHasCalculated] = useState(false);
    // 패널이 펼쳐진 후에 결과를 배치하여 순간적인 줄바꿈을 막는다.
    const [layoutReady, setLayoutReady] = useState(false);
    // 스케줄까지 화면에 펼쳐졌는지 관리한다.
    const [screenReady, setScreenReady] = useState(false);

    useEffect(() => {
        if (!hasCalculated) return;

        // 패널 이동 0.65초가 끝난 다음 결과를 표시한다.
        const timer = window.setTimeout(() => {
            setLayoutReady(true);
        }, 700);

        // 다른 화면으로 이동하면 예약한 상태 변경을 취소한다.
        return () => window.clearTimeout(timer);
    }, [hasCalculated]);

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
    const canCalculate = validateLoanInput(calculationInput, method) === "";

    function handleMethodChange(value) {
        setMethod(value);

        // 만기일시로 바꾸면 이전 거치 값도 초기화
        if (value === "bullet") {
            setValues((previous) => ({
                ...previous,
                graceMonths: "0",
            }));
        }

        // 상환 방식이 바뀌면 결과를 숨기고 입력 패널을 가운데로 되돌린다.
        setResult(null);
        setHasCalculated(false);

        // 재계산할 때 패널 이동 후부터 결과 등장 순서를 다시 시작한다.
        setLayoutReady(false);
        setCalculationError("");
    }

    function handleInputChange(field, nextValue) {
        // 013처럼 입력하면 앞자리 0을 제거하여 13으로 표시한다.
        let value = nextValue.replace(/^0+(?=\d)/, "");

        // 새 입력과 비교하기 위해 현재 화면에 표시된 값을 가져온다.
        const previousValue = values[field.name];

        // 금리의 소수 자리가 0일 때 뒤에 숫자 하나를 입력하면 0을 교체한다.
        // 예: 기존 11.0 뒤에 5 입력 → 11.05 → 11.5로 변경한다.
        // 다른 금리 입력과 금액·기간 입력에는 이 규칙을 적용하지 않는다.
        if (
            field.name === "annualInterestRate" &&
            previousValue.endsWith(".0") &&
            value.startsWith(previousValue) &&
            /^\d+\.0\d$/.test(value)
        ) {
            value = value.replace(/\.0(\d)$/, ".$1");
        }

        // 교체한 값에도 기존 소수 한 자리·금리 상한 검사를 적용한다.
        const error =
            field.name === "annualInterestRate"
                ? validateRateInput(value)
                : validateIntegerInput(value, field.maximum);

        // 허용하지 않는 형식이나 상한 초과 입력은 반영하지 않는다.
        if (error) return;

        // 검사를 통과한 입력 항목만 새 값으로 변경한다.
        setValues((previous) => ({
            ...previous,
            [field.name]: value,
        }));

        // 조건이 바뀌면 결과를 숨기고 입력 패널을 가운데로 되돌린다.
        setResult(null);
        setHasCalculated(false);

        // 재계산할 때 패널 이동 후부터 결과 등장 순서를 다시 시작한다.
        setLayoutReady(false);
        setCalculationError("");
    }

    function handleInputBlur(name) {
        // 입력을 마치면 2. 같은 표시를 2로 정리
        setValues((previous) => ({
            ...previous,
            [name]: previous[name] === "" ? "" : String(Number(previous[name])),
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
        // Enter나 버튼으로 계산해도 페이지를 새로고침하지 않는다.
        event.preventDefault();

        if (!canCalculate) return;

        try {
            // 계산에 성공했을 때만 입력칸의 포커스를 해제한다.
            const nextResult = calculateLoan(calculationInput, method);
            const focusedInput = event.currentTarget.querySelector("input:focus");

            // Enter 제출 후에도 커서와 진한 입력 밑줄이 남지 않게 한다.
            if (focusedInput) {
                focusedInput.blur();
            }

            // 가운데 입력 패널을 펼친 뒤 결과를 순서대로 표시한다.
            setResult(nextResult);
            setHasCalculated(true);

            // 같은 조건으로 재계산해도 등장 효과를 다시 재생한다.
            // 새 계산의 화면 등장 효과가 끝날 때까지 툴팁을 차단한다.
            setScreenReady(false);
            setChartVersion((previous) => previous + 1);
            setCalculationError("");
        } catch (error) {
            // 계산 실패 시 결과를 숨기고 가운데 입력 패널로 되돌린다.
            setResult(null);
            setHasCalculated(false);
            setLayoutReady(false);
            setCalculationError(
                error instanceof Error
                    ? error.message
                    : "계산하지 못했습니다. 입력을 확인해주세요.",
            );
        }
    }

    return (
        <section
            className={`panel monthly-payment ${hasCalculated ? "is-expanded" : ""}`}
            aria-labelledby={formId + "-title"}
        >
            <div className="monthly-payment-layout">
                {/* 왼쪽 위: 기존 설명 없이 제목과 입력만 표시 */}
                <div className="loan-input-column">
                    <h2 id={formId + "-title"} className="loan-calculator-title">
                        {isInterestPage ? "총 이자" : "월 상환액"}
                    </h2>

                    <form className="monthly-payment-fields" onSubmit={handleCalculate} noValidate>
                        {/* 상환 방식 선택창은 입력 영역 맨 위에 배치 */}
                        <div className="form-field loan-method-field">
                            <span id={formId + "-method-label"}>상환 방식</span>
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
                            const inputId = formId + "-" + field.name;
                            const helpId = inputId + "-help";
                            const convertedText = getConvertedText(field.name);
                            const warning = field.name === "graceMonths" ? graceError : "";

                            return (
                                <div key={field.name} className="monthly-number-field">
                                    <label htmlFor={inputId}>{field.label}</label>

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
                                            aria-invalid={warning ? true : undefined}
                                            aria-describedby={
                                                warning || convertedText ? helpId : undefined
                                            }
                                            onChange={(event) =>
                                                handleInputChange(field, event.target.value)
                                            }
                                            onBlur={() => handleInputBlur(field.name)}
                                        />

                                        <span className="monthly-input-unit">{field.unit}</span>
                                    </div>

                                    {/* 거치 관계 오류는 기간 환산 문구 대신 표시 */}
                                    {warning ? (
                                        <p id={helpId} className="monthly-input-error" role="alert">
                                            {warning}
                                        </p>
                                    ) : convertedText ? (
                                        <p id={helpId} className="monthly-converted-value">
                                            {convertedText}
                                        </p>
                                    ) : null}
                                </div>
                            );
                        })}

                        {/* 실제 계산 실패가 있을 때만 오류 표시 */}
                        {calculationError && (
                            <p className="monthly-input-error" role="alert">
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

                {/* 입력 이동이 끝난 뒤 결과를 순서대로 표시한다. */}
                {result && layoutReady && (
                    <>
                        {/* 재계산할 때도 결과창의 등장 효과를 다시 실행한다. */}
                        <div key={`result-${chartVersion}`} className="loan-result-column">
                            <LoanResults mode={mode} result={result} />
                        </div>

                        {/* 그래프 틀이 나타난 뒤 막대 상승을 시작한다. */}
                        <div key={`chart-${chartVersion}`} className="loan-chart-column">
                            <LoanChart
                                mode={mode}
                                result={result}
                                chartId={formId + "-chart"}
                                animationBegin={850}
                                screenReady={screenReady}
                            />
                        </div>

                        {/* 막대 상승이 끝나면 상환표 높이를 펼치며 표시한다. */}
                        <div
                            key={`schedule-${chartVersion}`}
                            className="loan-schedule-reveal"
                            onAnimationEnd={(event) => {
                                // 스케줄 자체의 펼침 효과가 끝났을 때만 허용한다.
                                if (
                                    event.target === event.currentTarget &&
                                    event.animationName === "loan-reveal-schedule"
                                ) {
                                    setScreenReady(true);
                                }
                            }}
                        >
                            <div className="loan-schedule-inner">
                                <LoanSchedule
                                    mode={mode}
                                    result={result}
                                    scheduleId={formId + "-schedule"}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
