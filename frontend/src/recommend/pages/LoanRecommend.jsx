import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import SelectBox from "../../components/SelectBox/SelectBox.jsx";
import ChoiceGroup from "../components/ChoiceGroup.jsx";
import ResultGroups from "../components/ResultGroups.jsx";
import ProductDialog from "../components/ProductDialog.jsx";
import RateChart from "../components/RateChart.jsx";
import { getLoanChoices, getLoanRecommendation } from "../api/recommendApi.js";
import styles from "../recommend.module.css";

const EMPTY_FORM = {
    residence_status: "",
    purpose: "",
    visit: "",
};

export default function LoanRecommend() {
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

    const complete = Object.values(form).every(Boolean);

    useEffect(() => {
        let active = true;
        setChoicesError(null);
        getLoanChoices()
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

        getLoanRecommendation(submitted)
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
        setSubmitted(form);
    }

    const purposeOptions = (choices?.choices.purpose ?? []).map((value) => ({
        value,
        label: t(`recommendLoan.purposeOptions.${value}`, { defaultValue: value }),
    }));
    const visitOptions = (choices?.choices.visit ?? []).map((value) => ({
        value,
        label: t(`recommendLoan.visitOptions.${value}`, { defaultValue: value }),
    }));
    const residenceOptions = [
        { value: "", label: t("recommendForm.choose") },
        ...(choices?.residence_status ?? []).map((value) => ({ value, label: value })),
    ];

    const renderFacts = (item) => (
        <>
            <div>
                <dt>{t("recommendLoan.rateAvg")}</dt>
                <dd>
                    <strong>
                        {item.rate_avg != null
                            ? t("recommendLoan.rateValue", { rate: item.rate_avg })
                            : t("recommendLoan.noRate")}
                    </strong>
                </dd>
            </div>
            {item.rate_range && (
                <div>
                    <dt>{t(`recommendLoan.rateRange.${result?.loan_type ?? "jeonse"}`)}</dt>
                    <dd>
                        {t("recommendLoan.rateRangeValue", {
                            min: item.rate_range[0],
                            max: item.rate_range[1],
                        })}
                    </dd>
                </div>
            )}
            <div>
                <dt>{t("recommendLoan.kind")}</dt>
                <dd>{item.product_kind}</dd>
            </div>
            {item.limit_text && (
                <div>
                    <dt>{t("recommendLoan.limit")}</dt>
                    <dd>{item.limit_text}</dd>
                </div>
            )}
            {item.repay_types?.length > 0 && (
                <div>
                    <dt>{t("recommendLoan.repay")}</dt>
                    <dd>{item.repay_types.join(", ")}</dd>
                </div>
            )}
            <div>
                <dt>{t("recommendLoan.joinWay")}</dt>
                <dd>
                    {item.join_way}
                    {item.visit_required && ` · ${t("recommendLoan.visitRequired")}`}
                </dd>
            </div>
        </>
    );

    const shownItems = result ? result.groups.flatMap((group) => group.items) : [];
    const month = result ? `${result.base_month.slice(0, 4)}.${result.base_month.slice(4)}` : "";

    return (
        <div className="page-stack">
            <section className="panel" aria-labelledby="loan-recommend-title">
                <h2 id="loan-recommend-title">{t("recommendLoan.title")}</h2>
                <p className="form-help">{t("recommendLoan.description")}</p>

                {choicesError ? (
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
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.step}>
                            <h3>{t("recommendLoan.fastTitle")}</h3>
                            <div className={`form-field ${styles.group}`}>
                                <span id="loan-residence-label">
                                    {t("recommendForm.residenceStatus")}
                                </span>
                                <div className={styles.select}>
                                    <SelectBox
                                        id="loan-residence"
                                        labelledBy="loan-residence-label"
                                        value={form.residence_status}
                                        options={residenceOptions}
                                        onChange={(value) => update("residence_status", value)}
                                    />
                                </div>
                            </div>
                            <ChoiceGroup
                                name="loan-purpose"
                                legend={t("recommendLoan.purpose")}
                                value={form.purpose}
                                options={purposeOptions}
                                onChange={(value) => update("purpose", value)}
                            />
                            <ChoiceGroup
                                name="loan-visit"
                                legend={t("recommendLoan.visit")}
                                value={form.visit}
                                options={visitOptions}
                                onChange={(value) => update("visit", value)}
                            />
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
                    </form>
                )}
            </section>

            {submitted && (
                <section
                    ref={resultsRef}
                    className={styles.results}
                    aria-labelledby="loan-results-title"
                    aria-busy={loading}
                >
                    <h2 id="loan-results-title">{t("recommendForm.resultsTitle")}</h2>

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

                    {result && (
                        <>
                            <ul className={styles.notices}>
                                {result.notices.map((key) => (
                                    <li key={key}>
                                        {t(`recommendResult.notices.${key}`, { month })}
                                    </li>
                                ))}
                            </ul>

                            <RateChart items={shownItems} />

                            <ResultGroups
                                groups={result.groups}
                                mismatch={result.mismatch}
                                renderFacts={renderFacts}
                                onDetail={(item, group) =>
                                    setSelected({ item, guide: group.guide })
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
