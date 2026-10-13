import { useState } from "react";
import SelectBox from "../SelectBox/SelectBox.jsx";
import {
    validateIntegerInput,
    validateRateInput,
    formatAmount,
    formatMonths,
} from "../../utils/calculatorInput.js";
import "../../styles/monthlyPayment.css";

const numericFields = [
    {
        name: "loanAmount",
        label: "대출금액",
        unit: "만원",
        maximum: 999999999999,
    },
    {
        name: "annualInterestRate",
        label: "연 금리",
        unit: "%",
    },
    {
        name: "repaymentMonths",
        label: "상환 기간",
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

const repaymentOptions = [
    { value: "equalPayment", label: "원리금 균등" },
    { value: "equalPrincipal", label: "원금 균등" },
    { value: "bullet", label: "만기 일시" },
];

// 입력 제한과 단위 환산을 적용한 계산기 배치
export default function MonthlyPayment() {
    const [values, setValues] = useState({
        loanAmount: "",
        annualInterestRate: "",
        repaymentMonths: "",
        graceMonths: "0",
    });

    const [errors, setErrors] = useState({});
    const [repaymentMethod, setRepaymentMethod] = useState("equalPayment");

    // 허용되지 않는 입력은 반영하지 않고 오류 안내
    function handleInputChange(field, nextValue) {
        const message =
            field.name === "annualInterestRate"
                ? validateRateInput(nextValue)
                : validateIntegerInput(nextValue, field.maximum);

        setErrors((previous) => ({
            ...previous,
            [field.name]: message,
        }));

        if (message) {
            return;
        }

        setValues((previous) => ({
            ...previous,
            [field.name]: nextValue,
        }));
    }

    // 입력을 마치면 앞쪽의 불필요한 0과 끝 소수점 정리
    function handleInputBlur(name) {
        setValues((previous) => ({
            ...previous,
            [name]:
                previous[name] === ""
                    ? ""
                    : String(Number(previous[name])),
        }));
    }

    function getConvertedText(name) {
        if (name === "loanAmount") {
            return formatAmount(values[name]);
        }

        if (name === "repaymentMonths" || name === "graceMonths") {
            return formatMonths(values[name]);
        }

        return "";
    }

    return (
        <section
            className="panel monthly-payment"
            aria-labelledby="monthly-payment-title"
        >
            <h1 id="monthly-payment-title">예상 월 상환액</h1>

            <p className="monthly-payment-description">
                첫 회차·평균·최대 상환액을 확인하고,
                월별 납부 계획에 활용해 보세요.
            </p>

            <div className="monthly-payment-layout">
                <div className="monthly-payment-fields">
                    {numericFields.map((field) => {
                        const inputId = `monthly-${field.name}`;
                        const helpId = `${inputId}-help`;
                        const errorId = `${inputId}-error`;

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
                                        aria-invalid={Boolean(errors[field.name])}
                                        aria-describedby={
                                            errors[field.name]
                                                ? `${helpId} ${errorId}`
                                                : helpId
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

                                <p
                                    id={helpId}
                                    className="monthly-converted-value"
                                >
                                    {getConvertedText(field.name)}
                                </p>

                                {errors[field.name] && (
                                    <p
                                        id={errorId}
                                        className="monthly-input-error"
                                        role="alert"
                                    >
                                        {errors[field.name]}
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    <div className="monthly-method-field">
                        <label
                            id="monthly-method-label"
                            htmlFor="monthly-method"
                        >
                            상환 방식
                        </label>

                        <div className="monthly-method-select">
                            <SelectBox
                                id="monthly-method"
                                labelledBy="monthly-method-label"
                                value={repaymentMethod}
                                options={repaymentOptions}
                                onChange={setRepaymentMethod}
                            />
                        </div>
                    </div>

                    <p className="form-help">
                        거치 기간은 이자만 납부하는 기간입니다.
                        상환 기간보다 짧게 입력하고, 없으면 0을 입력하세요.
                    </p>

                    <button
                        type="button"
                        className="button button-primary monthly-payment-button"
                        disabled
                    >
                        계산하기
                    </button>
                </div>

                <dl
                    className="monthly-payment-results"
                    aria-label="월 상환액 결과"
                >
                    <div className="monthly-payment-result">
                        <dt>예상 월 상환액</dt>
                        <dd>— KRW</dd>
                    </div>

                    <div className="monthly-payment-result">
                        <dt>월 평균 상환액</dt>
                        <dd>— KRW</dd>
                    </div>

                    <div className="monthly-payment-result">
                        <dt>가장 큰 월 상환액</dt>
                        <dd>— KRW</dd>
                    </div>
                </dl>
            </div>
        </section>
    );
}