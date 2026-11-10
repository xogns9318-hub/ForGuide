import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FieldError from "../../components/FieldError/FieldError.jsx";
import SelectBox from "../../components/SelectBox/SelectBox.jsx";
import { getFinance, updateFinance } from "../api/memberApi.js";
import { msg, messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import styles from "./AuthPage.module.css";

// 금액 입력은 만원 단위, 서버는 원 단위 (입력 실수를 막는 상한: 100억 원 = 100만 만원)
const WON_PER_MANWON = 10000;
const MAX_MANWON = 1_000_000;

// 원 → 만원 입력값 (모르는 값 null은 빈칸)
function toManwonText(won) {
    return won == null ? "" : String(won / WON_PER_MANWON);
}

// 만원 입력값 → 원 (빈칸은 null = 모름, 0은 그대로 0)
function toWon(text) {
    return text.trim() === "" ? null : Math.round(Number(text) * WON_PER_MANWON);
}

// 금액 칸 검사: 빈칸은 괜찮고, 값이 있으면 0 이상 상한 이하의 숫자
function validateAmount(text) {
    if (text.trim() === "") return "";
    const value = Number(text);
    return Number.isFinite(value) && value >= 0 && value <= MAX_MANWON
        ? ""
        : msg("auth.myFinance.amountInvalid", { max: MAX_MANWON.toLocaleString() });
}

const fieldOrder = [
    "annualIncome",
    "employmentTypeCode",
    "existingLoanAmount",
    "creditScoreBand",
    "mainBank",
    "visaTypeCode",
];

// 서버 응답 → 입력 폼 값
function toForm(finance) {
    return {
        annualIncome: toManwonText(finance.annualIncome),
        employmentTypeCode: finance.employmentTypeCode ?? "",
        existingLoanAmount: toManwonText(finance.existingLoanAmount),
        creditScoreBand: finance.creditScoreBand ?? "",
        mainBank: finance.mainBank ?? "",
        visaTypeCode: finance.visaTypeCode ?? "",
    };
}

// 내 금융 정보 (/my-finance, 헤더 '내 금융 정보') — 모든 항목은 선택이며 모르면 비워 둔다
// 비어 있는(저장된 값이 없는) 항목에는 "확인 필요"를 표시한다
// 체류자격(비자)은 프로필과 같은 값이라 여기서 바꾸면 프로필도 바뀐다
export default function MyFinance() {
    const { t } = useTranslation();

    const [finance, setFinance] = useState(null); // 마지막으로 불러오거나 저장한 서버 값
    const [form, setForm] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const inputRefs = useRef({});
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        getFinance()
            .then((data) => {
                if (!mounted.current) return;
                setFinance(data);
                setForm(toForm(data));
            })
            .catch((error) => {
                if (mounted.current)
                    setLoadError(apiErrorMessage(error, "auth.myFinance.loadFailed"));
            });
        return () => {
            mounted.current = false;
        };
    }, []);

    function updateField(name, value) {
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setFormError("");
        setMessage("");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSaving || !form) return;

        // 화면 1차 검사 (서버가 같은 규칙으로 다시 검사한다)
        const nextErrors = {
            annualIncome: validateAmount(form.annualIncome),
            existingLoanAmount: validateAmount(form.existingLoanAmount),
        };
        setErrors(nextErrors);
        const first = fieldOrder.find((field) => nextErrors[field]);
        if (first) {
            inputRefs.current[first]?.focus();
            return;
        }

        setIsSaving(true);
        setFormError("");
        try {
            // 빈칸은 null(모름)로 보낸다
            const saved = await updateFinance({
                annualIncome: toWon(form.annualIncome),
                employmentTypeCode: form.employmentTypeCode || null,
                existingLoanAmount: toWon(form.existingLoanAmount),
                creditScoreBand: form.creditScoreBand || null,
                mainBank: form.mainBank || null,
                visaTypeCode: finance.visaApplicable ? form.visaTypeCode || null : null,
            });
            if (!mounted.current) return;

            setFinance(saved);
            setForm(toForm(saved));
            setMessage(msg("auth.myFinance.saved"));
        } catch (saveError) {
            if (!mounted.current) return;
            const fieldErrors = apiFieldErrors(saveError);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
                const firstField = fieldOrder.find((field) => fieldErrors[field]);
                if (firstField) inputRefs.current[firstField]?.focus();
                return;
            }
            setFormError(apiErrorMessage(saveError, "auth.myFinance.saveFailed"));
        } finally {
            if (mounted.current) setIsSaving(false);
        }
    }

    // 입력 항목 공통 속성 (라벨 연결, 오류 안내 연결, 포커스 참조)
    function fieldProps(name) {
        return {
            id: `finance-${name}`,
            name,
            value: form?.[name] ?? "",
            onChange: (event) => updateField(name, event.target.value),
            ref: (element) => {
                inputRefs.current[name] = element;
            },
            "aria-invalid": Boolean(errors[name]),
            "aria-describedby": errors[name] ? `finance-${name}-error` : undefined,
            disabled: isSaving || !form,
        };
    }

    // 라벨 + 저장된 값이 없으면 "확인 필요"
    function label(name, text) {
        const unknown = finance && finance[name] == null;
        return (
            <label id={`finance-${name}-label`} htmlFor={`finance-${name}`}>
                {text}
                {unknown && (
                    <span className={styles.needCheck}>{t("auth.myFinance.needCheck")}</span>
                )}
            </label>
        );
    }
    function renderSelect(name, options, emptyLabel = t("auth.profileEdit.notSelected")) {
        const { name: fieldName, ...props } = fieldProps(name);

        return (
            <SelectBox
                {...props}
                labelledBy={`finance-${fieldName}-label`}
                options={[{ value: "", label: emptyLabel }, ...options]}
                onChange={(value) => updateField(fieldName, value)}
                maxVisibleOptions={6}
            />
        );
    }
    const choices = finance?.choices;

    return (
        <div className="page-stack">
            <form
                className={`panel ${styles.card}`}
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="my-finance-title"
                aria-busy={!form && !loadError}
            >
                <div className={styles.head}>
                    <h1 id="my-finance-title" className={styles.title}>
                        {t("auth.myFinance.title")}
                    </h1>
                    <p className={styles.description}>{t("auth.myFinance.description")}</p>
                </div>

                {loadError && (
                    <p className="form-error" role="alert">
                        {messageText(t, loadError)}
                    </p>
                )}

                <div className={styles.fields}>
                    {/* 연 소득 (만원) */}
                    <div className="form-field">
                        {label("annualIncome", t("auth.myFinance.annualIncome"))}
                        <input
                            {...fieldProps("annualIncome")}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                        />
                        <p className="form-help">{t("auth.myFinance.manwonHelp")}</p>
                        <FieldError
                            id="finance-annualIncome-error"
                            message={messageText(t, errors.annualIncome)}
                        />
                    </div>

                    {/* 고용 형태 */}
                    <div className="form-field">
                        {label("employmentTypeCode", t("auth.myFinance.employmentType"))}
                        {renderSelect("employmentTypeCode", (choices?.employmentTypes ?? []).map((code) => ({
                            value: code,
                            label: t(`auth.myFinance.employment.${code}`),
                        })))}
                        <FieldError
                            id="finance-employmentTypeCode-error"
                            message={messageText(t, errors.employmentTypeCode)}
                        />
                    </div>

                    {/* 기존 대출 (만원, 없으면 0) */}
                    <div className="form-field">
                        {label("existingLoanAmount", t("auth.myFinance.existingLoan"))}
                        <input
                            {...fieldProps("existingLoanAmount")}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                        />
                        <p className="form-help">{t("auth.myFinance.existingLoanHelp")}</p>
                        <FieldError
                            id="finance-existingLoanAmount-error"
                            message={messageText(t, errors.existingLoanAmount)}
                        />
                    </div>

                    {/* 신용점수 구간 (선택, 상세 추천과 같은 구간) */}
                    <div className="form-field">
                        {label("creditScoreBand", t("auth.myFinance.creditScoreBand"))}
                        {renderSelect(
                            "creditScoreBand",
                            (choices?.creditScoreBands ?? []).map((code) => ({
                                value: code,
                                label: t(`auth.myFinance.creditBand.${code}`),
                            })),
                            t("auth.myFinance.unknown"),
                        )}
                        <FieldError
                            id="finance-creditScoreBand-error"
                            message={messageText(t, errors.creditScoreBand)}
                        />
                    </div>

                    {/* 주거래은행 (추천 데이터의 은행 + 기타·없음) */}
                    <div className="form-field">
                        {label("mainBank", t("auth.myFinance.mainBank"))}
                        {renderSelect("mainBank", (choices?.banks ?? []).map((bank) => ({
                            value: bank.code,
                            label: bank.code === "OTHER" || bank.code === "NONE"
                                ? t(`auth.myFinance.bank.${bank.code}`)
                                : bank.name,
                        })))}
                        <FieldError
                            id="finance-mainBank-error"
                            message={messageText(t, errors.mainBank)}
                        />
                    </div>

                    {/* 체류자격(비자) — 프로필과 같은 값. 내국인이면 숨긴다 */}
                    {finance?.visaApplicable && (
                        <div className="form-field">
                            {label("visaTypeCode", t("auth.common.visaType"))}
                            {renderSelect("visaTypeCode", (choices?.visaTypes ?? []).map((item) => ({
                                value: item.code,
                                label: item.name,
                            })))}
                            <p className="form-help">{t("auth.myFinance.visaHelp")}</p>
                            <FieldError
                                id="finance-visaTypeCode-error"
                                message={messageText(t, errors.visaTypeCode)}
                            />
                        </div>
                    )}
                </div>

                {message && (
                    <p className={styles.ok} role="status">
                        {messageText(t, message)}
                    </p>
                )}
                {formError && (
                    <p className="form-error" role="alert">
                        {messageText(t, formError)}
                    </p>
                )}

                <div className={styles.actions}>
                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={isSaving || !form}
                    >
                        {isSaving ? t("auth.common.saving") : t("auth.common.save")}
                    </button>
                    <Link to="/mypage" className="button">
                        {t("auth.myFinance.backToMyPage")}
                    </Link>
                </div>
            </form>
        </div>
    );
}
