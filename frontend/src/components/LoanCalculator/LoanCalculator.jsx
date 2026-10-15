// 화면 상태와 생명주기를 관리하는 React 기능 사용
import { useId, useState } from "react";
// 입력 검사와 단위 환산 함수 사용
import {
    validateIntegerInput,
    validateRateInput,
    formatAmount,
    formatMonths,
} from "../../utils/calculatorInput.js";
// 두 계산기가 공유하는 계산 함수와 표시 정보 사용
import {
    calculateLoanComparison,
    getGraceError,
    validateLoanInput,
} from "../../utils/loanCalculator.js";
import {
    LoanResults,
    LoanChart,
    LoanSchedule,
} from "./LoanResults.jsx";
// 이 화면에서 사용할 스타일 연결
import "../../styles/monthlyPayment.css";

// 입력 이름·단위·상한을 한 목록으로 관리
const numericFields = [
    {
        // 입력 상태에서 사용할 항목 이름
        name: "loanAmount",
        // 화면에 표시할 이름
        label: "대출금액",
        // 입력 또는 표시 값의 단위
        unit: "만원",
        // 사용자가 정한 입력 상한
        maximum: 999999999999,
    },
    {
        // 입력 상태에서 사용할 항목 이름
        name: "annualInterestRate",
        // 화면에 표시할 이름
        label: "연 금리",
        // 입력 또는 표시 값의 단위
        unit: "%",
    },
    {
        // 입력 상태에서 사용할 항목 이름
        name: "repaymentMonths",
        // 화면에 표시할 이름
        label: "상환 기간",
        // 입력 또는 표시 값의 단위
        unit: "개월",
        // 사용자가 정한 입력 상한
        maximum: 600,
    },
    {
        // 입력 상태에서 사용할 항목 이름
        name: "graceMonths",
        // 화면에 표시할 이름
        label: "거치 기간",
        // 입력 또는 표시 값의 단위
        unit: "개월",
        // 사용자가 정한 입력 상한
        maximum: 600,
    },
];

// 입력과 계산 함수는 공유하고 결과 표시 목적만 구분
export default function LoanCalculator({ mode = "monthly" }) {
    // 입력창과 안내 문구가 다른 계산기와 겹치지 않도록 식별자 생성
    const formId = useId();
    // 계산기 종류에 따라 제목과 설명 선택
    const isInterestPage = mode === "interest";

    // 빈 값과 소수점 입력 중 상태를 보존하기 위해 문자열로 관리
    const [values, setValues] = useState({
        loanAmount: "",
        annualInterestRate: "",
        repaymentMonths: "",
        graceMonths: "0",
    });

    // 계산 전에는 결과를 숨기고 계산 후 세 방식의 결과 저장
    const [results, setResults] = useState(null);
    // 요약·그래프·상환표에서 사용할 상환 방식 관리
    const [activeMethod, setActiveMethod] = useState("equalPayment");
    // 계산 실행 오류 문구 관리
    const [calculationError, setCalculationError] = useState("");

    // 거치 기간과 상환 기간의 관계 오류 확인
    const graceError = getGraceError(values);
    // 필수값과 입력 제한을 통과한 경우에만 계산 허용
    const canCalculate = validateLoanInput(values) === "";

    // 앞자리의 불필요한 0을 제거하고 허용된 입력만 반영
    function handleInputChange(field, nextValue) {
        // 뒤에 숫자가 이어지는 불필요한 앞자리 0만 제거
        const normalizedValue = nextValue.replace(/^0+(?=\d)/, "");

        // 검증 함수가 반환한 오류 문구 확인
        const message =
            field.name === "annualInterestRate"
                ? validateRateInput(normalizedValue)
                : validateIntegerInput(normalizedValue, field.maximum);

        // 검증 오류가 있으면 다음 처리를 진행하지 않음
        if (message) {
            return;
        }

        setValues((previous) => ({
            ...previous,
            [field.name]: normalizedValue,
        }));

        // 입력 조건이 바뀌면 이전 계산 결과 초기화
        setResults(null);
        // 이전 계산 오류 안내 초기화
        setCalculationError("");
    }

    // 숫자의 표시 형태만 정리
    function handleInputBlur(name) {
        setValues((previous) => ({
            ...previous,
            // 입력 상태에서 사용할 항목 이름
            [name]:
                previous[name] === ""
                    ? ""
                    : String(Number(previous[name])),
        }));
    }

    // 항목 이름에 맞는 금액 또는 기간 환산 문구 선택
    function getConvertedText(name) {
        if (name === "loanAmount") {
            return formatAmount(values[name]);
        }

        if (name === "repaymentMonths" || name === "graceMonths") {
            return formatMonths(values[name]);
        }

        return "";
    }

    // 두 페이지 모두 같은 함수로 세 방식 계산
    function handleCalculate(event) {
        // 페이지 새로고침이나 브라우저 기본 키 동작 방지
        event.preventDefault();

        // 버튼과 동일한 검증 기준으로 계산 실행 차단
        if (!canCalculate) {
            return;
        }

        try {
            // 동일한 입력으로 세 방식의 계산 결과 저장
            setResults(calculateLoanComparison(values));
            // 이전 계산 오류 안내 초기화
            setCalculationError("");
        } catch (error) {
            // 이전 계산 결과를 숨김
            setResults(null);
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
            aria-labelledby={`${formId}-title`}
        >
            <div className="monthly-payment-layout">
                {/* 왼쪽 전체 높이를 결과 영역의 높이 기준으로 사용 */}
                <div className="loan-input-column">
                    {/* 현재 화면의 제목 표시 */}
                    <h1 id={`${formId}-title`}>
                        {/* 계산기 종류에 맞는 제목 또는 설명 선택 */}
                        {isInterestPage
                            ? "총 이자 계산기"
                            : "월 상환액 계산기"}
                    </h1>

                    {/* 현재 계산기 목적에 맞는 설명 표시 */}
                    <p className="monthly-payment-description">
                        {/* 계산기 종류에 맞는 제목 또는 설명 선택 */}
                        {isInterestPage
                            ? "상환 방식별 총이자와 월별 상환 내역을 확인해 보세요."
                            : "상환 방식별 납입 원금과 잔금 변화를 확인해 보세요."}
                    </p>

                    {/* 입력 상태와 계산 버튼을 같은 폼으로 연결 */}
                    <form
                        className="monthly-payment-fields"
                        onSubmit={handleCalculate}
                        noValidate
                    >
                        {/* 항목 설정을 반복해 같은 형식의 입력창 생성 */}
                        {numericFields.map((field) => {
                            // 항목 이름을 포함한 고유 입력 식별자 생성
                            const inputId = `${formId}-${field.name}`;
                            // 입력창과 해당 안내 문구를 연결할 식별자 생성
                            const helpId = `${inputId}-help`;
                            // 입력값을 읽기 쉬운 금액 또는 기간 단위로 환산
                            const convertedText =
                                getConvertedText(field.name);

                            // 거치 기간 항목에만 기간 관계 오류 전달
                            const warning =
                                field.name === "graceMonths"
                                    ? graceError
                                    : "";

                            return (
                                <div
                                    key={field.name}
                                    className="monthly-number-field"
                                >
                                    {/* 입력 식별자와 제목을 연결 */}
                                    <label htmlFor={inputId}>
                                        {field.label}
                                    </label>

                                    {/* 숫자 입력과 단위를 한 줄에 배치 */}
                                    <div className="monthly-number-line">
                                        {/* 문자열 입력 상태와 변경·포커스 종료 동작 연결 */}
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

                                        {/* 입력 항목의 단위를 숫자 오른쪽에 표시 */}
                                        <span className="monthly-input-unit">
                                            {field.unit}
                                        </span>
                                    </div>

                                    {/* 기간 관계 오류가 있으면 환산 문구 대신 경고 표시 */}
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

                        {/* 입력 또는 결과 해석에 필요한 보조 설명 */}
                        <p className="form-help">
                            총 대출기간은 상환 기간과 거치 기간을
                            더한 기간입니다. 거치 중에는 이자만 납부합니다.
                        </p>

                        {/* 계산 실행 오류가 있을 때만 경고 표시 */}
                        {calculationError && (
                            <p
                                className="monthly-input-error"
                                role="alert"
                            >
                                {calculationError}
                            </p>
                        )}

                        {/* 입력 검증 결과로 활성 여부를 정하고 폼 계산 실행 */}
                        <button
                            type="submit"
                            className="button button-primary monthly-payment-button"
                            disabled={!canCalculate}
                        >
                            계산하기
                        </button>
                    </form>
                </div>

                {/* 오른쪽: 요약 바로 아래에 상환표를 연결 */}
                <div className="loan-result-slot">
                    <div className="loan-result-stack">
                        {/* 선택한 방식의 요약과 상환 방식 버튼 표시 */}
                        <LoanResults
                            mode={mode}
                            results={results}
                            activeMethod={activeMethod}
                            onMethodChange={setActiveMethod}
                        />

                        {/* 같은 계산 결과로 회차별 원금과 잔금 표시 */}
                        <LoanSchedule
                            results={results}
                            activeMethod={activeMethod}
                            scheduleId={`${formId}-schedule`}
                        />
                    </div>
                </div>

                {/* 왼쪽 아래: 그래프 */}
                <LoanChart
                    mode={mode}
                    results={results}
                    activeMethod={activeMethod}
                    chartId={`${formId}-chart`}
                />
            </div>
        </section>
    );
}