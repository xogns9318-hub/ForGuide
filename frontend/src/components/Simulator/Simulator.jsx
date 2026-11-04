import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
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
} from "../../utils/budgetSimulator.js";
import { formatKrw } from "../../utils/currencyFormat.js";
import styles from "../../styles/simulator.module.css";

const emptyValues = Object.fromEntries(
    [...MONEY_FIELDS, "start", "end"].map((key) => [key, ""]),
);

// 날짜 숫자를 YYYY-MM-DD 형식으로 정리한다.
function formatDateInput(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    if (digits.length <= 4) {
        return digits;
    }

    if (digits.length <= 6) {
        return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }

    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function MoneyField({ id, label, value, hint, onChange, won }) {
    return (
        <div className={styles.field}>
            <label htmlFor={id}>{label}</label>

            <div className={styles.numberLine}>
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={14}
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

    const calendarRef = useRef(null);
    const touchStart = useRef(null);

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

    const canCalculate = inputError(values) === "";

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

    function changeValue(field, value) {
        if (MONEY_FIELDS.includes(field)) {
            if (value !== "" && moneyError(value)) {
                setError(moneyError(value));
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
        setError("");
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
        setError("");
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

    useEffect(() => {
        const calendar = calendarRef.current;
        if (!layoutReady || !calendar) return;

        const wheel = { last: 0, sum: 0, lockedUntil: 0 };

        function onWheel(event) {
            if (
                event.ctrlKey ||
                Math.abs(event.deltaY) <= Math.abs(event.deltaX)
            ) {
                return;
            }

            event.preventDefault();

            const now = performance.now();

            if (now - wheel.last > 140) wheel.sum = 0;

            wheel.last = now;

            // 잠금 시간이 지나면 자동으로 다시 입력을 받는다.
            if (now < wheel.lockedUntil) return;

            const multiplier =
                event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 300 : 1;

            wheel.sum += event.deltaY * multiplier;

            if (Math.abs(wheel.sum) < 40) return;

            moveMonth(Math.sign(wheel.sum));

            wheel.sum = 0;
            wheel.lockedUntil = now + 400;
        }

        calendar.addEventListener("wheel", onWheel, { passive: false });

        return () => calendar.removeEventListener("wheel", onWheel);
    }, [layoutReady, moveMonth]);

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
                                    <div className={styles.field} key={field}>
                                        <label htmlFor={id + "-" + field}>
                                            {text("fields." + field)}
                                        </label>

                                        <input
                                            id={id + "-" + field}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="off"
                                            maxLength={10}
                                            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                                            placeholder={text("dateFormat")}
                                            value={values[field]}
                                            onChange={(event) =>
                                                changeValue(field, formatDateInput(event.target.value))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>

                            {values.start &&
                                values.end &&
                                inputError(values) === "dateOrder" && (
                                    <p className={styles.error}>
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
                            className={`button button-primary ${styles.calculate}`}
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
                                ref={calendarRef}
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
                                                        : "dayLabel",
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
                                    {text("calendarHint")}
                                </p>

                                {editDate && (
                                    <form
                                        className={styles.editor}
                                        onSubmit={saveExtra}
                                    >
                                        <div className={styles.editorHeader}>
                                            <strong>
                                                {text("extraTitle", {
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
                                            label={text("extraAmount")}
                                            value={extra}
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
                                            {text("extraHint")}
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
                                                {text("remove")}
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
                                {text("formula", {
                                    cash: won(result.totals.cash),
                                    income: won(result.totals.income),
                                    payment: won(result.totals.payment),
                                    fixed: won(result.totals.fixed),
                                    food: won(result.totals.food),
                                    living: won(result.totals.living),
                                    balance: won(result.balance),
                                })}
                            </p>

                            <dl className={styles.summary}>
                                {[
                                    ["available", won(result.balance)],
                                    [
                                        "days",
                                        text("dayCount", {
                                            count: result.days,
                                        }),
                                    ],
                                    ["daily", won(plan.daily)],
                                    ["extraTotal", won(plan.specialTotal)],
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

                            <p className={styles.note}>
                                {text("dailyFormula", {
                                    available: won(result.available),
                                    extra: won(plan.specialTotal),
                                    days: result.days,
                                    daily: won(plan.daily),
                                })}{" "}
                                {plan.remainder > 0n &&
                                    text("remainder", {
                                        count: numberFormatter.format(plan.remainder),
                                    })}
                            </p>

                            <p className={styles.note}>
                                {text("assumption")}
                            </p>

                            <div
                                className={styles.chart}
                                role="img"
                                aria-label={text("chartLabel")}
                            >
                                <ResponsiveContainer width="100%" height={26}>
                                    <BarChart
                                        layout="vertical"
                                        data={[
                                            {
                                                name: "budget",
                                                expenses: Number(
                                                    result.expenses,
                                                ),
                                                available: Number(
                                                    result.available,
                                                ),
                                            },
                                        ]}
                                        margin={{
                                            top: 0,
                                            right: 0,
                                            bottom: 0,
                                            left: 0,
                                        }}
                                    >
                                        <XAxis type="number" hide />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            hide
                                        />

                                        <Bar
                                            dataKey="expenses"
                                            stackId="budget"
                                            fill="#d4eae2"
                                            isAnimationActive={false}
                                        />

                                        <Bar
                                            dataKey="available"
                                            stackId="budget"
                                            fill="#527b73"
                                            isAnimationActive={false}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>

                                <span>{text("chartLegend")}</span>
                            </div>

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