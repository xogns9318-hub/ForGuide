import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { initialConsultationOptions } from "../../api/consultationApi.js";
import { translatePreparationDetails } from "../../api/preparationCardApi.js";
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

function getBirthMonthDays(year, month) {
    const monthNumber = Number(month);

    if (monthNumber === 2) {
        // 연도를 아직 입력 중이면 29일까지 보여 주고, 완성 후 윤년을 판별한다.
        if (!/^\d{4}$/.test(year) || Number(year) < 1) return 29;

        const yearNumber = Number(year);
        const leapYear = yearNumber % 400 === 0 || (yearNumber % 4 === 0 && yearNumber % 100 !== 0);

        return leapYear ? 29 : 28;
    }

    return [4, 6, 9, 11].includes(monthNumber) ? 30 : 31;
}

function changeBirthDate(currentValue, part, value) {
    const [year = "", month = "", day = ""] = currentValue.split("-");
    const next = {
        year,
        month,
        day,
        [part]: part === "year" ? value.replace(/[^0-9]/g, "").slice(0, 4) : value,
    };

    // 연·월 변경으로 존재하지 않게 된 날짜는 다시 선택하도록 초기화한다.
    if (!next.month || Number(next.day) > getBirthMonthDays(next.year, next.month)) {
        next.day = "";
    }

    return [next.year, next.month, next.day].join("-");
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
    const { t, i18n } = useTranslation();
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
    const [isTranslating, setIsTranslating] = useState(false);
    const requestSequence = useRef(0);
    const activeRequest = useRef(null);

    useEffect(() => {
        return () => {
            // 페이지를 떠난 뒤 도착하는 응답으로 화면 상태를 갱신하지 않는다.
            requestSequence.current += 1;
            activeRequest.current = null;
        };
    }, []);

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
    }, [result?.id]);

    const topic = TOPICS.find((item) => item.name === form.topic);

    const now = new Date();
    const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
    ].join("-");

    const [birthYear = "", birthMonth = "", birthDay = ""] = form.birthDate.split("-");
    const birthDays = getBirthMonthDays(birthYear, birthMonth);
    const birthDateComplete = /^\d{4}-\d{2}-\d{2}$/.test(form.birthDate);

    // 실제로 존재하는 날짜인지와 허용 범위 안에 있는지를 함께 검사한다.
    const birthDateValid =
        birthDateComplete &&
        Number(birthYear) >= 1900 &&
        Number(birthMonth) >= 1 &&
        Number(birthMonth) <= 12 &&
        Number(birthDay) >= 1 &&
        Number(birthDay) <= birthDays &&
        form.birthDate <= today;

    const birthYearInvalid =
        birthYear.length === 4 &&
        (Number(birthYear) < 1900 || Number(birthYear) > now.getFullYear());

    const birthDateInvalid = birthYearInvalid || (birthDateComplete && !birthDateValid);

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

    function clearResult() {
        // 진행 중인 번역의 응답을 무효화한다. 입력값 자체는 저장하지 않는다.
        requestSequence.current += 1;
        activeRequest.current = null;
        setIsTranslating(false);
        setResult(null);
    }

    function updateForm(patch) {
        // 입력을 수정하면 이전 확인과 결과를 지우고 다시 준비한다.
        setForm((previous) => ({ ...previous, ...patch }));
        setConfirmed(0);
        setTranslation(null);
        clearResult();
    }

    function updateBirthDate(part, value) {
        // 생년월일을 바꿀 때도 기존 확인·번역 결과를 함께 초기화한다.
        updateForm({
            birthDate: changeBirthDate(form.birthDate, part, value),
        });
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
        clearResult();
    }

    async function translateCard(card) {
        // 같은 요청이 진행 중이면 완료 버튼·재시도를 중복 실행하지 않는다.
        if (activeRequest.current !== null) return;

        const requestId = ++requestSequence.current;
        activeRequest.current = requestId;
        setIsTranslating(true);

        setResult((previous) =>
            previous?.id === card.id
                ? {
                      ...previous,
                      translationStatus: "loading",
                      translationError: null,
                  }
                : previous,
        );

        try {
            const translatedDetails = await translatePreparationDetails(card.form.details);

            // 입력을 수정했거나 다른 결과를 만들었다면 이전 응답은 표시하지 않는다.
            if (requestSequence.current !== requestId) return;

            setResult((previous) =>
                previous?.id === card.id
                    ? {
                          ...previous,
                          translatedDetails,
                          translationStatus: "success",
                      }
                    : previous,
            );
        } catch (error) {
            if (requestSequence.current !== requestId) return;

            // 서버가 전달한 오류 코드에 따라 현재 사이트 언어의 안내를 고른다.
            const errorMessages = {
                TIMEOUT: "translationTimeout",
                TRANSLATION_TIMEOUT: "translationTimeout",
                TRANSLATION_UNAVAILABLE: "translationUnavailable",
                TRANSLATION_RATE_LIMITED: "translationRateLimited",
                NETWORK_ERROR: "translationConnectionFailed",
            };
            const translationError = errorMessages[error.code] ?? "translationFailed";

            setResult((previous) =>
                previous?.id === card.id
                    ? {
                          ...previous,
                          translationStatus: "error",
                          translationError,
                      }
                    : previous,
            );
        } finally {
            if (activeRequest.current === requestId) {
                activeRequest.current = null;
                setIsTranslating(false);
            }
        }
    }

    async function complete(event) {
        event.preventDefault();

        if (activeRequest.current !== null) return;

        if (!canComplete) {
            await alert(text("incomplete"), { theme: "preparation" });
            return;
        }

        // 원문 카드의 문구는 완료 당시 언어로 고정하고 실제 입력값은 보존한다.
        const card = {
            id: ++resultSequence.current,
            language: i18n.resolvedLanguage || i18n.language || "ko",
            form: {
                ...form,
                givenName: form.givenName.trim(),
                surname: form.surname.trim(),
                keywords: [...form.keywords],
            },
            translation,
            translationStatus: translation ? "loading" : "none",
            translatedDetails: null,
            translationError: null,
        };

        setResult(card);

        if (translation) await translateCard(card);
    }

    function printCards() {
        // 번역 중에는 인쇄하지 않고 완성된 카드만 출력한다.
        if (!result || isTranslating) return;
        window.print();
    }

    function renderCard(translated) {
        const saved = result.form;
        const language = translated ? "ko" : result.language;
        const cardT = i18n.getFixedT(language);
        const cardText = (key, options) => cardT(`preparationCard.${key}`, options);

        const cardSelection = (value) =>
            value === "other"
                ? cardText("other")
                : value === "세금신고·납부"
                  ? cardText("taxKeyword")
                  : cardT(`institutionGuide.selectionLabels.${value}`, {
                        defaultValue: value,
                    });

        const values = [
            ["givenName", saved.givenName],
            ["surname", saved.surname],
            ["gender", cardText(saved.gender)],
            ["birthDate", saved.birthDate],
            ["occurrence", cardText(`periods.${saved.occurrence}`)],
        ];

        return (
            <article
                lang={language}
                className={`panel ${styles.resultCard} ${styles.resultReveal}`}
                style={{ "--result-delay": translated ? "420ms" : "0ms" }}
                aria-busy={translated && result.translationStatus === "loading"}
            >
                <h2>{cardText(translated ? "translatedTitle" : "originalTitle")}</h2>

                {translated && result.translationStatus === "loading" ? (
                    <p
                        className={styles.translationNote}
                        role="status"
                        lang={i18n.resolvedLanguage || i18n.language || "ko"}
                    >
                        {text("translating")}
                    </p>
                ) : translated && result.translationStatus === "error" ? (
                    <div lang={i18n.resolvedLanguage || i18n.language || "ko"}>
                        <p className={styles.translationNote} role="alert">
                            {text(result.translationError)}
                        </p>

                        <button
                            type="button"
                            className={`button ${styles.complete}`}
                            aria-disabled={isTranslating}
                            disabled={isTranslating}
                            onClick={() => translateCard(result)}
                        >
                            {text("retryTranslation")}
                        </button>
                    </div>
                ) : (
                    <>
                        {translated && (
                            <p className={styles.translationNote}>
                                {cardText("translationReview")}
                            </p>
                        )}

                        <dl className={styles.resultFields}>
                            {values.map(([key, value]) => (
                                <div key={key}>
                                    <dt>{cardText(key)}</dt>
                                    <dd>{value}</dd>
                                </div>
                            ))}
                        </dl>

                        <h3>
                            {cardText("issue")} - {cardSelection(saved.topic)}
                            {saved.keywords.length > 0 &&
                                ` (${saved.keywords.map(cardSelection).join(", ")})`}
                        </h3>

                        <p className={styles.resultDetails}>
                            {translated ? result.translatedDetails : saved.details}
                        </p>
                    </>
                )}
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
                    {["givenName", "surname"].map((key) => (
                        <label className={styles.field} key={key}>
                            <span>{text(key)}</span>

                            <input
                                type="text"
                                value={form[key]}
                                title={text("nameRule")}
                                required
                                onCompositionEnd={(event) =>
                                    updateForm({
                                        [key]: sanitizeName(event.currentTarget.value),
                                    })
                                }
                                onChange={(event) =>
                                    updateForm({
                                        [key]: event.nativeEvent.isComposing
                                            ? event.target.value
                                            : sanitizeName(event.target.value),
                                    })
                                }
                            />
                        </label>
                    ))}

                    <div className={styles.field}>
                        <span id="preparation-birth-label">{text("birthDate")}</span>

                        <div
                            className={styles.birthDateInputs}
                            role="group"
                            aria-labelledby="preparation-birth-label"
                        >
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                placeholder={text("birthYearPlaceholder")}
                                aria-label={text("birthYear")}
                                aria-invalid={birthDateInvalid}
                                aria-describedby={
                                    birthDateInvalid ? "preparation-birth-error" : undefined
                                }
                                value={birthYear}
                                onChange={(event) => updateBirthDate("year", event.target.value)}
                                required
                            />

                            <div className={styles.field} data-filled={Boolean(birthMonth)}>
                                <span id="preparation-birth-month-label" className={styles.srOnly}>
                                    {text("birthMonth")}
                                </span>

                                <SelectBox
                                    id="preparation-birth-month"
                                    labelledBy="preparation-birth-month-label"
                                    value={birthMonth}
                                    maxVisibleOptions={6}
                                    options={[
                                        { value: "", label: text("birthMonth") },
                                        ...Array.from({ length: 12 }, (_, index) => ({
                                            value: String(index + 1).padStart(2, "0"),
                                            label: text("birthMonthValue", {
                                                value: index + 1,
                                            }),
                                        })),
                                    ]}
                                    onChange={(value) => updateBirthDate("month", value)}
                                />
                            </div>

                            <div className={styles.field} data-filled={Boolean(birthDay)}>
                                <span id="preparation-birth-day-label" className={styles.srOnly}>
                                    {text("birthDay")}
                                </span>

                                <SelectBox
                                    id="preparation-birth-day"
                                    labelledBy="preparation-birth-day-label"
                                    value={birthDay}
                                    maxVisibleOptions={6}
                                    options={[
                                        { value: "", label: text("birthDay") },
                                        ...Array.from({ length: birthDays }, (_, index) => ({
                                            value: String(index + 1).padStart(2, "0"),
                                            label: text("birthDayValue", {
                                                value: index + 1,
                                            }),
                                        })),
                                    ]}
                                    onChange={(value) => updateBirthDate("day", value)}
                                />
                            </div>
                        </div>

                        {birthDateInvalid && (
                            <p
                                id="preparation-birth-error"
                                className={styles.birthDateError}
                                role="alert"
                            >
                                {text("birthDateInvalid")}
                            </p>
                        )}
                    </div>

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

                {translation === true && (
                    <p className={styles.translationNote}>{text("translationNotice")}</p>
                )}

                {/* 미완료 상태의 안내는 유지하고, 번역 중에만 실제 클릭을 막는다. */}
                <button
                    type="submit"
                    className={`button ${styles.complete}`}
                    aria-disabled={!canComplete || isTranslating}
                    disabled={isTranslating}
                >
                    {text(isTranslating ? "translating" : "complete")}
                </button>
            </form>

            {result && (
                <section
                    key={result.id}
                    ref={resultsRef}
                    className={styles.results}
                    aria-label={text("results")}
                >
                    <div className={styles.printToolbar}>
                        <button
                            type="button"
                            className={`button ${styles.complete}`}
                            aria-disabled={isTranslating}
                            disabled={isTranslating}
                            onClick={printCards}
                        >
                            {text("print")}
                        </button>
                    </div>
                    {renderCard(false)}
                    {result.translation && renderCard(true)}
                </section>
            )}
            {result &&
                createPortal(
                    <div
                        className={`${styles.page} ${styles.printRoot}`}
                        data-preparation-print=""
                    >
                        {renderCard(false)}
                        {result.translation &&
                            result.translationStatus === "success" &&
                            renderCard(true)}
                    </div>,
                    document.body,
                )}
        </div>
    );
}
