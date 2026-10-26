import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SelectBox from "../../components/SelectBox/SelectBox.jsx";
import ChoiceGroup from "../components/ChoiceGroup.jsx";
import ResultGroups from "../components/ResultGroups.jsx";
import ProductDialog from "../components/ProductDialog.jsx";
import PremiumChart from "../components/PremiumChart.jsx";
import { getInsuranceChoices, getInsuranceRecommendation } from "../api/recommendApi.js";
import styles from "../recommend.module.css";

const EMPTY_FORM = {
    health_insurance: "",
    residence_status: "",
    sex: "",
    age: "",
};

export default function InsuranceRecommend() {
    const { t } = useTranslation();
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitted, setSubmitted] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [retry, setRetry] = useState(0);
    const [selected, setSelected] = useState(null);
    const [choices, setChoices] = useState(null);
    const [choicesError, setChoicesError] = useState(null);
    const [choicesRetry, setChoicesRetry] = useState(0);
    const resultsRef = useRef(null);

    const gateOpen = form.health_insurance === "예";
    const gateClosed = form.health_insurance !== "" && !gateOpen;
    const [minAge, maxAge] = choices?.choices.age ?? [19, 99];
    const ageNumber = Number(form.age);
    const ageValid = /^\d+$/.test(form.age) && ageNumber >= minAge && ageNumber <= maxAge;
    const complete = gateOpen && form.residence_status && form.sex && ageValid;

    useEffect(() => {
        let active = true;
        setChoicesError(null);
        getInsuranceChoices()
            .then((data) => {
                if (active) setChoices(data);
            })
            .catch((failure) => {
                if (active) setChoicesError(failure);
            });
        return () => {
            active = false;
        };
    }, [choicesRetry]);

    useEffect(() => {
        if (!submitted) return;
        let active = true;
        setLoading(true);
        setError(null);
        setResult(null);

        getInsuranceRecommendation(submitted)
            .then((data) => {
                if (active) setResult(data);
            })
            .catch((failure) => {
                if (active) setError(failure);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [submitted, retry]);

    useEffect(() => {
        if (submitted) resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [submitted]);

    function update(field, value) {
        setForm((previous) => ({ ...previous, [field]: value }));
        setSubmitted(null);
        setResult(null);
        setError(null);
        setSelected(null);
    }

    function handleSubmit(event) {
        event.preventDefault();
        if (!complete) return;
        setSubmitted({ ...form, age: String(ageNumber) });
    }

    const healthOptions = ["예", "아니오", "모름"].map((value) => ({
        value,
        label: t(`recommendInsurance.healthOptions.${value}`),
    }));
    const sexOptions = (choices?.choices.sex ?? []).map((value) => ({
        value,
        label: t(`recommendInsurance.sexOptions.${value}`, { defaultValue: value }),
    }));
    const residenceOptions = [
        { value: "", label: t("recommendForm.choose") },
        ...(choices?.residence_status ?? []).map((value) => ({ value, label: value })),
    ];

    const won = (amount) =>
        t("recommendInsurance.premiumValue", { amount: amount.toLocaleString("ko-KR") });

    const renderFacts = (item) => (
        <>
            <div>
                <dt>{t("recommendInsurance.premium")}</dt>
                <dd>
                    <strong>{won(item.monthly_premium)}</strong>
                </dd>
            </div>
            {item.premium_breakdown && (
                <div>
                    <dt>{t("recommendInsurance.breakdown")}</dt>
                    <dd>
                        {t("recommendInsurance.breakdownValue", {
                            basic: won(item.premium_breakdown.basic),
                            rider1: won(item.premium_breakdown.rider1),
                            rider2: won(item.premium_breakdown.rider2),
                        })}
                    </dd>
                </div>
            )}
            <div>
                <dt>{t("recommendInsurance.insurerType")}</dt>
                <dd>{item.insurer_type}</dd>
            </div>
            <div>
                <dt>{t("recommendInsurance.joinWay")}</dt>
                <dd>
                    {item.online ? t("recommendInsurance.online") : t("recommendInsurance.offline")}
                </dd>
            </div>
        </>
    );

    const shownItems = result?.groups ? result.groups.flatMap((group) => group.items) : [];
    const date = result?.base_date
        ? `${result.base_date.slice(0, 4)}.${result.base_date.slice(4, 6)}.${result.base_date.slice(6)}`
        : "";
    const fallbackGuide = result?.groups?.[0]?.guide;

    return (
        <div className="page-stack">
            <section className="panel" aria-labelledby="insurance-recommend-title">
                <h2 id="insurance-recommend-title">{t("recommendInsurance.title")}</h2>
                <p className="form-help">{t("recommendInsurance.description")}</p>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                    <div className={styles.step}>
                        <h3>{t("recommendInsurance.gateTitle")}</h3>
                        <ChoiceGroup
                            name="insurance-health"
                            legend={t("recommendInsurance.healthInsurance")}
                            value={form.health_insurance}
                            options={healthOptions}
                            onChange={(value) => update("health_insurance", value)}
                        />
                    </div>

                    {gateClosed ? (
                        <div className={styles.callout} role="status">
                            <h3>{t("recommendInsurance.noInsuranceTitle")}</h3>
                            <p>{t("recommendInsurance.noInsuranceBody")}</p>
                            <Link to="/service/consultation" className="button">
                                {t("recommendInsurance.noInsuranceAction")}
                            </Link>
                        </div>
                    ) : !gateOpen ? null : choicesError ? (
                        <div role="alert" className="form-error">
                            <p>{t("recommendForm.loadError")}</p>
                            <button
                                type="button"
                                className="button"
                                onClick={() => setChoicesRetry((previous) => previous + 1)}
                            >
                                {t("recommendForm.retry")}
                            </button>
                        </div>
                    ) : !choices ? (
                        <p role="status">{t("recommendForm.loadingChoices")}</p>
                    ) : (
                        <>
                            <div className={styles.step}>
                                <h3>{t("recommendInsurance.fastTitle")}</h3>
                                <div className={`form-field ${styles.group}`}>
                                    <span id="insurance-residence-label">
                                        {t("recommendForm.residenceStatus")}
                                    </span>
                                    <div className={styles.select}>
                                        <SelectBox
                                            id="insurance-residence"
                                            labelledBy="insurance-residence-label"
                                            value={form.residence_status}
                                            options={residenceOptions}
                                            onChange={(value) => update("residence_status", value)}
                                        />
                                    </div>
                                </div>
                                <ChoiceGroup
                                    name="insurance-sex"
                                    legend={t("recommendInsurance.sex")}
                                    value={form.sex}
                                    options={sexOptions}
                                    onChange={(value) => update("sex", value)}
                                />
                                <div className={`form-field ${styles.group} ${styles.select}`}>
                                    <label htmlFor="insurance-age">
                                        {t("recommendInsurance.age")}
                                    </label>
                                    <input
                                        id="insurance-age"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        maxLength={3}
                                        placeholder={t("recommendInsurance.agePlaceholder")}
                                        value={form.age}
                                        aria-invalid={
                                            form.age !== "" && !ageValid ? true : undefined
                                        }
                                        aria-describedby="insurance-age-help"
                                        onChange={(event) =>
                                            update("age", event.target.value.replace(/\D/g, ""))
                                        }
                                    />
                                    {form.age !== "" && !ageValid && (
                                        <p
                                            id="insurance-age-help"
                                            className="form-help"
                                            role="alert"
                                        >
                                            {t("recommendInsurance.ageError", {
                                                min: minAge,
                                                max: maxAge,
                                            })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <p className="form-help" aria-live="polite">
                                {complete ? "" : t("recommendForm.required")}
                            </p>
                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="button button-primary"
                                    disabled={!complete}
                                >
                                    {t("recommendForm.submit")}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </section>

            {submitted && (
                <section
                    ref={resultsRef}
                    className={styles.results}
                    aria-labelledby="insurance-results-title"
                    aria-busy={loading}
                >
                    <h2 id="insurance-results-title">{t("recommendForm.resultsTitle")}</h2>

                    {loading && <p role="status">{t("recommendForm.loading")}</p>}

                    {error && (
                        <div role="alert" className="form-error">
                            <p>
                                {error.code === "INVALID_INPUT"
                                    ? t("recommendForm.invalidInput")
                                    : t("recommendForm.loadError")}
                            </p>
                            <button
                                type="button"
                                className="button"
                                onClick={() => setRetry((previous) => previous + 1)}
                            >
                                {t("recommendForm.retry")}
                            </button>
                        </div>
                    )}

                    {result?.groups && (
                        <>
                            <ul className={styles.notices}>
                                {result.notices.map((key) => (
                                    <li key={key}>
                                        {t(`recommendResult.notices.${key}`, { date })}
                                    </li>
                                ))}
                            </ul>

                            <PremiumChart
                                items={shownItems}
                                sex={result.input.sex}
                                age={result.input.age}
                            />

                            <ResultGroups
                                groups={result.groups}
                                separate={result.separate}
                                renderFacts={renderFacts}
                                onDetail={(item, group) =>
                                    setSelected({ item, guide: group.guide ?? fallbackGuide })
                                }
                            />
                        </>
                    )}
                </section>
            )}

            {selected && (
                <ProductDialog
                    item={selected.item}
                    guide={selected.guide}
                    renderFacts={renderFacts}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}
