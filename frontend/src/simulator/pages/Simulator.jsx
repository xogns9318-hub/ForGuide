import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    MONEY_FIELDS,
    allocateBudget,
    calculateBudget,
    dateKey,
    dayBudget,
    daysInMonth,
    inputError,
    moneyError,
    monthInfo,
    readDate,
    wonParts,
} from "../utils/budgetSimulator.js";
import { formatKrw } from "../../utils/currencyFormat.js";
import SelectBox from "../../components/SelectBox/SelectBox.jsx";
import styles from "./Simulator.module.css";

const emptyValues = Object.fromEntries(
    [...MONEY_FIELDS, "start", "end"].map((key) => [key, ""]),
);

function dateDayCount(year, month) {
    if (!month) return 31;

    // 연도가 완성되기 전에도 2월 29일을 선택할 수 있게 한다.
    const calendarYear = year.length === 4 && Number(year) > 0 ? Number(year) : 2000;
    return daysInMonth(calendarYear, Number(month));
}

function DateField({ id, label, value, onChange, t }) {
    const [year, month = "", day = ""] = value.split("-");
    const monthLabel = t("preparationCard.birthMonth");
    const dayLabel = t("preparationCard.birthDay");

    function changePart(part, nextValue) {
        const next = { year, month, day, [part]: nextValue };

        // 연도나 월이 바뀌어 선택한 일이 유효하지 않으면 일을 다시 고르게 한다.
        if (Number(next.day) > dateDayCount(next.year, next.month)) {
            next.day = "";
        }

        // 기존 계산기에 전달하는 날짜 형식을 유지한다.
        onChange([next.year, next.month, next.day].join("-"));
    }

    return (
        <div className={styles.dateField} role="group" aria-labelledby={`${id}-label`}>
            <span id={`${id}-label`} className={styles.dateLabel}>
                {label}
            </span>

            <div className={styles.dateParts}>
                <input
                    id={`${id}-year`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    aria-label={`${label} ${t("preparationCard.birthYear")}`}
                    placeholder={t("preparationCard.birthYearPlaceholder")}
                    value={year}
                    onChange={(event) => changePart("year", event.target.value.replace(/\D/g, ""))}
                />

                <span id={`${id}-month-label`} hidden>{monthLabel}</span>
                <SelectBox
                    id={`${id}-month`}
                    labelledBy={`${id}-label ${id}-month-label`}
                    value={month}
                    options={[
                        { value: "", label: monthLabel },
                        ...Array.from({ length: 12 }, (_, index) => ({
                            value: String(index + 1).padStart(2, "0"),
                            label: t("preparationCard.birthMonthValue", { value: index + 1 }),
                        })),
                    ]}
                    onChange={(value) => changePart("month", value)}
                    maxVisibleOptions={6}
                />

                <span id={`${id}-day-label`} hidden>{dayLabel}</span>
                <SelectBox
                    id={`${id}-day`}
                    labelledBy={`${id}-label ${id}-day-label`}
                    value={day}
                    options={[
                        { value: "", label: dayLabel },
                        ...Array.from({ length: dateDayCount(year, month) }, (_, index) => ({
                            value: String(index + 1).padStart(2, "0"),
                            label: t("preparationCard.birthDayValue", { value: index + 1 }),
                        })),
                    ]}
                    onChange={(value) => changePart("day", value)}
                    maxVisibleOptions={6}
                />
            </div>
        </div>
    );
}

function MoneyField({ id, label, value, hint, onChange, won, placeholder }) {
    return (
        <div className={styles.field}>
            <label htmlFor={id}>{label}</label>

            <div className={styles.numberLine}>
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    aria-describedby={id + "-hint"}
                />
                <span>{won}</span>
            </div>

            <p id={id + "-hint"} className={styles.converted}>
                {hint || "\u00a0"}
            </p>
        </div>
    );
}

export default function Simulator() {
    const { t, i18n } = useTranslation();
    const text = (key, options) => t("simulator." + key, options);
    const id = useId();

    const [values, setValues] = useState(emptyValues);
    const [result, setResult] = useState(null);
    const [layoutReady, setLayoutReady] = useState(false);
    const [error, setError] = useState("");
    const [specialDays, setSpecialDays] = useState({});
    const [month, setMonth] = useState(0);
    const [editDate, setEditDate] = useState("");
    const [extra, setExtra] = useState("");
    const [extraError, setExtraError] = useState("");
    const touchStart = useRef(null);
    const amountWarningTimer = useRef(null);

    const numberFormatter = useMemo(
        () => new Intl.NumberFormat(i18n.language),
        [i18n.language],
    );

    // 실제 계산 금액은 모두 원화이므로, 현재 언어에 맞는 KRW 표기로 보여준다.
    const won = (value) => formatKrw(value, i18n.language);

    // 한국어에서는 만·억·조 보조 표기를 유지하고,
    // 외국어에서는 실제 KRW 금액으로 명확하게 안내한다.
    const converted = (value) => {
        if (value === "") {
            return "";
        }

        if (i18n.language !== "ko") {
            return formatKrw(value, i18n.language);
        }

        return wonParts(value)
            .map(
                (part) =>
                    numberFormatter.format(part.count) +
                    text("units." + part.unit),
            )
            .join(" ");
    };

    const validationError = inputError(values);
    const canCalculate = validationError === "";
    const startDate = readDate(values.start);
    const endDate = readDate(values.end);

    const plan = useMemo(
        () => (result ? allocateBudget(result, specialDays) : null),
        [result, specialDays],
    );

    useEffect(() => {
        if (!result) return;

        // 입력 패널 이동이 끝난 뒤 캘린더를 표시한다.
        const timer = window.setTimeout(() => setLayoutReady(true), 700);

        return () => window.clearTimeout(timer);
    }, [result]);

    useEffect(() => {
        return () => window.clearTimeout(amountWarningTimer.current);
    }, []);

    function changeValue(field, value) {
        if (MONEY_FIELDS.includes(field)) {
            const warning = value === "" ? "" : moneyError(value);

            if (warning) {
                window.clearTimeout(amountWarningTimer.current);
                setError(warning);

                // 마지막으로 거부한 금액 입력부터 3초 뒤에 경고를 숨긴다.
                amountWarningTimer.current = window.setTimeout(() => {
                    setError("");
                }, 3000);
                return;
            }

            value = value.replace(/^0+(?=\d)/, "");
        }

        if (values[field] === value) return;

        setValues((previous) => ({ ...previous, [field]: value }));

        // 입력 조건이 바뀌면 결과와 추가 배정을 지우고 가운데로 돌아간다.
        setResult(null);
        setLayoutReady(false);
        setSpecialDays({});
        setEditDate("");
    }

    function calculate(event) {
        event.preventDefault();

        if (!canCalculate) return;

        const next = calculateBudget(values);

        event.currentTarget.querySelector("input:focus")?.blur();

        setResult(next);
        setLayoutReady(false);
        setMonth(next.start.monthIndex);
        setSpecialDays({});
        setEditDate("");
    }

    const moveMonth = useCallback(
        (direction) => {
            if (!result) return;

            // 항상 한 달씩 이동하며 계산 기간 밖으로는 넘어가지 않는다.
            setMonth((previous) =>
                Math.max(
                    result.start.monthIndex,
                    Math.min(result.end.monthIndex, previous + direction),
                ),
            );

            setEditDate("");
            setExtraError("");
        },
        [result],
    );

    function closeEditor() {
        document.getElementById(id + "-day-" + editDate)?.focus();
        setEditDate("");
        setExtraError("");
    }

    function saveExtra(event) {
        event.preventDefault();

        const invalid = moneyError(extra);

        if (invalid) {
            setExtraError(invalid);
            return;
        }

        const next = { ...specialDays };

        if (BigInt(extra) === 0n) delete next[editDate];
        else next[editDate] = extra;

        try {
            // 추가 배정도 전체 사용 가능 예산 안에서만 허용한다.
            allocateBudget(result, next);
            setSpecialDays(next);
            closeEditor();
        } catch (failure) {
            setExtraError(failure.message);
        }
    }

    function renderMoney(field) {
        return (
            <MoneyField
                key={field}
                id={id + "-" + field}
                label={text("fields." + field)}
                value={values[field]}
                hint={converted(values[field])}
                onChange={(value) => changeValue(field, value)}
                won={i18n.language === "ko" ? text("units.won") : "KRW"}
            />
        );
    }

    const current = monthInfo(month);
    const count = daysInMonth(current.year, current.month);

    const firstDate = result
        ? new Date(
              readDate(dateKey(current.year, current.month, 1)).ordinal *
                  86400000,
          )
        : null;

    const first = firstDate ? firstDate.getUTCDay() : 0;

    const monthLabel = firstDate
        ? new Intl.DateTimeFormat(i18n.language, {
              year: "numeric",
              month: "long",
              timeZone: "UTC",
          }).format(firstDate)
        : "";

    const specialEntries = Object.entries(specialDays).sort(([a], [b]) =>
        a.localeCompare(b),
    );

    return (
        <section
            className={`panel ${styles.panel} ${result ? styles.expanded : ""}`}
            aria-labelledby={id + "-title"}
        >
            <div className={styles.layout}>
                <div className={styles.inputColumn}>
                    <h1 id={id + "-title"} className={styles.title}>
                        {text("title")}
                    </h1>

                    <form className={styles.form} onSubmit={calculate} noValidate>
                        {renderMoney("payment")}

                        <fieldset className={styles.dates}>
                            <legend>{text("period")}</legend>

                            <div className={styles.dateRow}>
                                {["start", "end"].map((field) => (
                                    <DateField
                                        key={field}
                                        id={`${id}-${field}`}
                                        label={text(`fields.${field}`)}
                                        value={values[field]}
                                        onChange={(value) => changeValue(field, value)}
                                        t={t}
                                    />
                                ))}
                            </div>

                            {(!startDate || !endDate) && (
                                <p className={styles.dateHint}>
                                    {text("errors.dateRange")}
                                </p>
                            )}

                            {startDate && endDate && startDate.ordinal > endDate.ordinal && (
                                <p className={styles.error} role="alert">
                                    {text("errors.dateOrder")}
                                </p>
                            )}
                        </fieldset>

                        {MONEY_FIELDS.slice(1).map(renderMoney)}

                        {error && (
                            <p className={styles.error} role="alert">
                                {text("errors." + error)}
                            </p>
                        )}

                        <button
                            type="submit"
                            className={`button ${styles.calculate}`}
                            disabled={!canCalculate}
                        >
                            {text("calculate")}
                        </button>
                    </form>
                </div>

                {result && layoutReady && (
                    <>
                        <div className={styles.calendarColumn}>
                            <div
                                className={styles.calendar}
                                role="region"
                                aria-label={text("calendar")}
                                tabIndex={0}
                                onKeyDown={(event) => {
                                    if (event.target.tagName === "INPUT") return;

                                    if (
                                        ["PageDown", "PageUp"].includes(
                                            event.key,
                                        )
                                    ) {
                                        event.preventDefault();
                                        moveMonth(
                                            event.key === "PageDown" ? 1 : -1,
                                        );
                                    }
                                }}
                                onTouchStart={(event) => {
                                    touchStart.current =
                                        event.touches[0]?.clientY;
                                }}
                                onTouchEnd={(event) => {
                                    if (touchStart.current === null) return;

                                    const distance =
                                        touchStart.current -
                                        event.changedTouches[0].clientY;

                                    if (Math.abs(distance) > 40) {
                                        moveMonth(Math.sign(distance));
                                    }

                                    touchStart.current = null;
                                }}
                            >
                                <div className={styles.calendarHeader}>
                                    <h2 className={styles.title}>
                                        {text("calendar")}
                                    </h2>

                                    <div className={styles.monthControls}>
                                        <button
                                            type="button"
                                            onClick={() => moveMonth(-1)}
                                            disabled={
                                                month ===
                                                result.start.monthIndex
                                            }
                                            aria-label={text("previous")}
                                        >
                                            ‹
                                        </button>

                                        <strong aria-live="polite">
                                            {monthLabel}
                                        </strong>

                                        <button
                                            type="button"
                                            onClick={() => moveMonth(1)}
                                            disabled={
                                                month === result.end.monthIndex
                                            }
                                            aria-label={text("next")}
                                        >
                                            ›
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className={styles.weekdays}
                                    aria-hidden="true"
                                >
                                    {Array.from({ length: 7 }, (_, day) => (
                                        <span key={day}>
                                            {text("weekdays." + day)}
                                        </span>
                                    ))}
                                </div>

                                <div key={month} className={styles.monthGrid}>
                                    {Array.from({ length: 42 }, (_, index) => {
                                        const day = index - first + 1;

                                        if (day < 1 || day > count) {
                                            return (
                                                <div
                                                    key={index}
                                                    className={styles.emptyDay}
                                                    aria-hidden="true"
                                                />
                                            );
                                        }

                                        const key = dateKey(
                                            current.year,
                                            current.month,
                                            day,
                                        );

                                        const amount = dayBudget(
                                            result,
                                            plan,
                                            key,
                                        );

                                        return (
                                            <button
                                                type="button"
                                                key={key}
                                                id={id + "-day-" + key}
                                                className={`${styles.day} ${
                                                    specialDays[key]
                                                        ? styles.specialDay
                                                        : ""
                                                }`}
                                                disabled={amount === null}
                                                aria-label={text(
                                                    amount === null
                                                        ? "outsideDay"
                                                        : "extraSpendDayLabel",
                                                    {
                                                        date: key,
                                                        amount:
                                                            amount === null
                                                                ? ""
                                                                : won(amount),
                                                    },
                                                )}
                                                onClick={() => {
                                                    setEditDate(key);
                                                    setExtra(
                                                        specialDays[key] ?? "",
                                                    );
                                                    setExtraError("");
                                                }}
                                            >
                                                <span
                                                    className={styles.dayNumber}
                                                >
                                                    {day}
                                                </span>

                                                {amount !== null && (
                                                    <span
                                                        className={
                                                            styles.dayAmount
                                                        }
                                                    >
                                                        {won(amount)}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                <p className={styles.calendarHint}>
                                    {text("calendarDateHint")}
                                </p>

                                {editDate && (
                                    <form
                                        className={styles.editor}
                                        onSubmit={saveExtra}
                                    >
                                        <div className={styles.editorHeader}>
                                            <strong>
                                                {text("extraSpendTitle", {
                                                    date: editDate,
                                                })}
                                            </strong>

                                            <button
                                                type="button"
                                                onClick={closeEditor}
                                                aria-label={text("close")}
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <MoneyField
                                            id={id + "-extra"}
                                            label={text("extraSpendAmount")}
                                            value={extra}
                                            placeholder="0"
                                            hint={converted(extra)}
                                            won={i18n.language === "ko" ? text("units.won") : "KRW"}
                                            onChange={(value) => {
                                                if (
                                                    value !== "" &&
                                                    moneyError(value)
                                                ) {
                                                    setExtraError(
                                                        moneyError(value),
                                                    );
                                                    return;
                                                }

                                                setExtra(
                                                    value.replace(
                                                        /^0+(?=\d)/,
                                                        "",
                                                    ),
                                                );
                                                setExtraError("");
                                            }}
                                        />

                                        <p className={styles.calendarHint}>
                                            {text("extraSpendHint")}
                                        </p>

                                        {extraError && (
                                            <p
                                                className={styles.error}
                                                role="alert"
                                            >
                                                {text("errors." + extraError)}
                                            </p>
                                        )}

                                        <div className={styles.editorActions}>
                                            <button
                                                type="submit"
                                                className="button"
                                                disabled={extra === ""}
                                            >
                                                {text("apply")}
                                            </button>

                                            <button
                                                type="button"
                                                className="button"
                                                onClick={() => {
                                                    const next = {
                                                        ...specialDays,
                                                    };

                                                    delete next[editDate];
                                                    setSpecialDays(next);
                                                    closeEditor();
                                                }}
                                            >
                                                {text("resetExtra")}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        <section
                            className={styles.results}
                            aria-labelledby={id + "-results"}
                        >
                            <h2
                                id={id + "-results"}
                                className={styles.title}
                            >
                                {text("results")}
                            </h2>

                            <p className={styles.formula}>
                                {text("budgetFormulaAfterExtra", {
                                    cash: won(result.totals.cash),
                                    income: won(result.totals.income),
                                    payment: won(result.totals.payment),
                                    fixed: won(result.totals.fixed),
                                    food: won(result.totals.food),
                                    living: won(result.totals.living),
                                    extra: won(plan.specialTotal),
                                    balance: won(result.balance - plan.specialTotal),
                                })}
                            </p>

                            <dl className={styles.summary}>
                                {[
                                    ["availableAfterExtra", won(plan.pool)],
                                    [
                                        "totalRepaymentDays",
                                        text("dayCount", {
                                            count: result.days,
                                        }),
                                    ],
                                    ["dailyAvailable", won(plan.daily)],
                                    ["remainingAvailable", won(plan.remainder)],
                                    ["extraSpendTotal", won(plan.specialTotal)],
                                ].map(([key, value]) => (
                                    <div key={key}>
                                        <dt>{text(key)}</dt>
                                        <dd>{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            {result.shortfall > 0n && (
                                <p className={styles.error} role="status">
                                    {text("shortfall", {
                                        amount: won(result.shortfall),
                                    })}
                                </p>
                            )}

                            <p className={styles.note}>{text("budgetSummaryNote")}</p>

                            {specialEntries.length > 0 && (
                                <ul className={styles.specialList}>
                                    {specialEntries.map(([date, amount]) => (
                                        <li key={date}>
                                            {date} · +{won(BigInt(amount))}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </>
                )}
            </div>
        </section>
    );
}