import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { initialConsultationOptions } from "../../api/consultationApi.js";
import { alert } from "../Modal/modal.js";
import SelectBox from "../SelectBox/SelectBox.jsx";
import styles from "../../styles/preparationCard.module.css";

const TOPICS = initialConsultationOptions.topics;

const PERIODS = [
    "under1",
    "months1to3",
    "months3to6",
    "months6to12",
    "years1",
    "years3",
    "years5",
    "years10",
];

const NOTICE_IDS = [1, 2, 3, 4, 5];
const NAME_SEGMENTER = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function sanitizeName(value) {
    // 외국어의 글자와 결합 부호는 허용하고 공백·숫자·특수문자는 제거한다.
    const letters = value
        .normalize("NFC")
        .replace(/[^\p{L}\p{M}]/gu, "")
        .replace(/^\p{M}+/u, "");

    // 외국어 결합 문자도 화면에 보이는 글자 기준으로 20자까지 받는다.
    return Array.from(NAME_SEGMENTER.segment(letters), ({ segment }) => segment)
        .slice(0, 20)
        .join("");
}

function makeInitialForm(context) {
    // 기관 상세에서 받은 값을 현재 선택 목록과 대조해 미리 채운다.
    const topic = TOPICS.find((item) => item.name === context?.topic);

    return {
        givenName: "",
        surname: "",
        birthDate: "",
        gender: "",
        occurrence: "",
        topic: topic?.name || "",
        keywords: topic?.keywords.filter((keyword) => context?.keywords?.includes(keyword)) || [],
        details: "",
    };
}

export default function PreparationCard() {
    const { t } = useTranslation();
    const { state } = useLocation();

    const text = (key, options) => t(`preparationCard.${key}`, options);

    const selection = (value) =>
        value === "other"
            ? text("other")
            : value === "세금신고·납부"
                ? text("taxKeyword")
                : t(`institutionGuide.selectionLabels.${value}`, { defaultValue: value });

    // 개인정보는 화면 상태에만 두고 브라우저 저장소나 서버에 저장하지 않는다.
    const [form, setForm] = useState(() => makeInitialForm(state?.consultation));
    const [confirmed, setConfirmed] = useState(0);
    const [translation, setTranslation] = useState(null);
    const [result, setResult] = useState(null);
    const resultsRef = useRef(null);
    const resultSequence = useRef(0);

    useEffect(() => {
        if (!result) return;

        // 결과 배치가 끝난 다음 고정 헤더에 가리지 않는 위치로 이동한다.
        const frame = requestAnimationFrame(() => {
            const element = resultsRef.current;
            if (!element) return;

            const header = document.querySelector(".app-layout > header");
            const fixedHeader =
                header && ["sticky", "fixed"].includes(getComputedStyle(header).position);

            const offset = (fixedHeader ? header.getBoundingClientRect().height : 0) + 24;
            const top = element.getBoundingClientRect().top + window.scrollY - offset;

            window.scrollTo({
                top: Math.max(0, top),
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "auto"
                    : "smooth",
            });
        });

        return () => cancelAnimationFrame(frame);
    }, [result]);

    const topic = TOPICS.find((item) => item.name === form.topic);

    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const birthDateValid =
        /^\d{4}-\d{2}-\d{2}$/.test(form.birthDate) &&
        !Number.isNaN(Date.parse(form.birthDate)) &&
        form.birthDate <= today;

    const formReady = Boolean(
        form.givenName &&
        form.givenName === sanitizeName(form.givenName) &&
        form.surname &&
        form.surname === sanitizeName(form.surname) &&
        birthDateValid &&
        ["male", "female"].includes(form.gender) &&
        PERIODS.includes(form.occurrence) &&
        (form.topic === "other" || (topic && form.keywords.length > 0)) &&
        form.details.trim() &&
        form.details.length <= 300,
    );

    const canComplete = formReady && confirmed === 5 && translation !== null;

    function updateForm(patch) {
        // 입력을 수정하면 이전 확인과 결과를 지우고 다시 준비한다.
        setForm((previous) => ({ ...previous, ...patch }));
        setConfirmed(0);
        setTranslation(null);
        setResult(null);
    }

    function chooseTopic(value) {
        updateForm({
            topic: form.topic === value ? "" : value,
            keywords: [],
        });
    }

    function toggleKeyword(value) {
        updateForm({
            keywords: form.keywords.includes(value)
                ? form.keywords.filter((item) => item !== value)
                : [...form.keywords, value],
        });
    }

    function chooseTranslation(value) {
        setTranslation(value);
        setResult(null);
    }

    async function complete(event) {
        event.preventDefault();

        if (!canComplete) {
            await alert(text("incomplete"), { theme: "preparation" });
            return;
        }

        // 완료할 때마다 결과를 새로 표시해 등장 효과를 다시 실행한다.
        setResult({
            id: ++resultSequence.current,
            form: {
                ...form,
                givenName: form.givenName.trim(),
                surname: form.surname.trim(),
                keywords: [...form.keywords],
            },
            translation,
        });
    }

    function renderCard(translated) {
        const saved = result.form;

        const values = [
            ["givenName", saved.givenName],
            ["surname", saved.surname],
            ["gender", text(saved.gender)],
            ["birthDate", saved.birthDate],
            ["occurrence", text(`periods.${saved.occurrence}`)],
        ];

        return (
            <article
                className={`panel ${styles.resultCard} ${styles.resultReveal}`}
                style={{ "--result-delay": translated ? "420ms" : "0ms" }}
            >
                <h2>{text(translated ? "translatedTitle" : "originalTitle")}</h2>

                {translated && (
                    <p className={styles.translationNote}>{text("translationPending")}</p>
                )}

                <dl className={styles.resultFields}>
                    {values.map(([key, value]) => (
                        <div key={key}>
                            <dt>{text(key)}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>

                <h3>
                    {text("issue")} - {selection(saved.topic)}
                    {saved.keywords.length > 0 && ` (${saved.keywords.map(selection).join(", ")})`}
                </h3>

                <p className={styles.resultDetails}>{saved.details}</p>
            </article>
        );
    }

    return (
        <div className={styles.page}>
            <form
                className={`panel ${styles.form}`}
                onSubmit={complete}
                noValidate
                autoComplete="off"
            >
                <h1>{text("title")}</h1>

                {state?.consultation?.institutionName && (
                    <p className={styles.institution}>
                        {text("institution", { name: state.consultation.institutionName })}
                    </p>
                )}

                <div className={styles.fields}>
                    {["givenName", "surname", "birthDate"].map((key) => (
                        <label className={styles.field} key={key}>
                            <span>{text(key)}</span>

                            <input
                                type={key === "birthDate" ? "date" : "text"}
                                value={form[key]}
                                max={key === "birthDate" ? today : undefined}
                                title={key === "birthDate" ? undefined : text("nameRule")}
                                required
                                onCompositionEnd={(event) => {
                                    if (key !== "birthDate") {
                                        updateForm({
                                            [key]: sanitizeName(event.currentTarget.value),
                                        });
                                    }
                                }}
                                onChange={(event) =>
                                    updateForm({
                                        [key]:
                                            key === "birthDate" || event.nativeEvent.isComposing
                                                ? event.target.value
                                                : sanitizeName(event.target.value),
                                    })
                                }
                            />
                        </label>
                    ))}

                    <fieldset className={styles.gender}>
                        <legend>{text("gender")}</legend>

                        <div className={styles.genderChoices}>
                            {["male", "female"].map((value) => (
                                <label key={value} className={styles.genderOption}>
                                    <input
                                        type="radio"
                                        name="preparation-gender"
                                        value={value}
                                        checked={form.gender === value}
                                        onChange={() => updateForm({ gender: value })}
                                    />

                                    <span>{text(value)}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div className={styles.field} data-filled={Boolean(form.occurrence)}>
                        <span id="preparation-occurrence-label">{text("occurrence")}</span>

                        <SelectBox
                            id="preparation-occurrence"
                            labelledBy="preparation-occurrence-label"
                            value={form.occurrence}
                            options={[
                                { value: "", label: text("choose") },
                                ...PERIODS.map((value) => ({
                                    value,
                                    label: text(`periods.${value}`),
                                })),
                            ]}
                            onChange={(value) => updateForm({ occurrence: value })}
                        />
                    </div>
                </div>

                <fieldset className={styles.problem}>
                    <legend>{text("issue")}</legend>

                    <div className={styles.choices}>
                        {[...TOPICS.map((item) => item.name), "other"].map((value) => (
                            <button
                                type="button"
                                key={value}
                                aria-pressed={form.topic === value}
                                className={styles.choice}
                                onClick={() => chooseTopic(value)}
                            >
                                {selection(value)}
                            </button>
                        ))}
                    </div>

                    {topic && (
                        <div className={styles.keywords}>
                            <p>{text("keywordHelp")}</p>

                            <div className={styles.choices}>
                                {topic.keywords.map((value) => (
                                    <button
                                        type="button"
                                        key={value}
                                        aria-pressed={form.keywords.includes(value)}
                                        className={styles.choice}
                                        onClick={() => toggleKeyword(value)}
                                    >
                                        {selection(value)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </fieldset>

                <label className={styles.details}>
                    <span>{text("details")}</span>

                    <textarea
                        rows={6}
                        maxLength={300}
                        value={form.details}
                        required
                        onChange={(event) =>
                            updateForm({ details: event.target.value.slice(0, 300) })
                        }
                        aria-describedby="preparation-character-count"
                    />
                </label>

                <p id="preparation-character-count" className={styles.counter}>
                    {text("characterCount", { count: form.details.length })}
                </p>

                {formReady && (
                    <section
                        className={styles.guidance}
                        aria-labelledby="preparation-guidance-title"
                    >
                        <h2 id="preparation-guidance-title">{text("guidanceTitle")}</h2>

                        <ol className={styles.notices}>
                            {NOTICE_IDS.slice(0, Math.min(5, confirmed + 1)).map((id, index) => (
                                <li
                                    key={id}
                                    className={`${styles.notice} ${styles.reveal} ${index < confirmed ? styles.confirmed : ""}`}
                                >
                                    <span aria-hidden="true">{id}.</span>

                                    <p>{text(`notices.${id}`)}</p>

                                    <button
                                        type="button"
                                        disabled={index < confirmed}
                                        onClick={() => {
                                            // 현재 안내를 확인해야 다음 박스를 연다.
                                            if (index === confirmed) {
                                                setConfirmed((value) => value + 1);
                                            }
                                        }}
                                    >
                                        {index < confirmed && <span aria-hidden="true">✓ </span>}
                                        {text("acknowledge")}
                                    </button>
                                </li>
                            ))}
                        </ol>

                        {confirmed === 5 && (
                            <fieldset className={`${styles.translation} ${styles.reveal}`}>
                                <legend className={styles.srOnly}>
                                    {text("translationQuestion")}
                                </legend>

                                <span aria-hidden="true">{text("translationQuestion")}</span>

                                <div className={styles.choices}>
                                    {[true, false].map((value) => (
                                        <button
                                            type="button"
                                            key={String(value)}
                                            aria-pressed={translation === value}
                                            className={styles.choice}
                                            onClick={() => chooseTranslation(value)}
                                        >
                                            {text(value ? "yes" : "no")}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>
                        )}
                    </section>
                )}

                {/* 미완료 상태에서도 클릭 시 알림을 열어야 하므로 disabled 속성은 사용하지 않는다. */}
                <button
                    type="submit"
                    className={`button ${styles.complete}`}
                    aria-disabled={!canComplete}
                >
                    {text("complete")}
                </button>
            </form>

            {result && (
                <section
                    key={result.id}
                    ref={resultsRef}
                    className={styles.results}
                    aria-label={text("results")}
                >
                    {renderCard(false)}
                    {result.translation && renderCard(true)}
                </section>
            )}
        </div>
    );
}