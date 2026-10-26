import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SelectBox from "../../components/SelectBox/SelectBox.jsx";
import ChoiceGroup from "../components/ChoiceGroup.jsx";
import ResultGroups from "../components/ResultGroups.jsx";
import ProductDialog from "../components/ProductDialog.jsx";
import InterestChart from "../components/InterestChart.jsx";
import { getAccountChoices, getAccountRecommendation } from "../api/recommendApi.js";
import { estimateInterest } from "../utils/interest.js";
import styles from "../recommend.module.css";

const EMPTY_FORM = {
    own_account: "",
    residence_status: "",
    visit: "",
    purpose: "",
    term: "",
    institution: "",
};

export default function AccountRecommend() {
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

    const noAccount = form.own_account === "아니오";
    const complete = Object.values(form).every(Boolean);

    useEffect(() => {
        let active = true;
        setChoicesError(null);
        getAccountChoices()
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

        getAccountRecommendation(submitted)
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
        if (!complete || noAccount) return;
        const { own_account: _ownAccount, ...input } = form;
        setSubmitted(input);
    }

    const yesNo = [
        { value: "예", label: t("recommendAccount.yes") },
        { value: "아니오", label: t("recommendAccount.no") },
    ];
    const toOptions = (field, label) =>
        (choices?.choices[field] ?? []).map((value) => ({
            value: String(value),
            label: label(value),
        }));
    const visitOptions = toOptions("visit", (value) =>
        t(`recommendAccount.visitOptions.${value}`, { defaultValue: value }),
    );
    const purposeOptions = toOptions("purpose", (value) =>
        t(`recommendAccount.purposeOptions.${value}`, { defaultValue: value }),
    );
    const termOptions = toOptions("term", (value) =>
        t("recommendAccount.termOption", { count: value }),
    );
    const institutionOptions = toOptions("institution", (value) =>
        t(`recommendAccount.institutionOptions.${value}`, { defaultValue: value }),
    );
    const residenceOptions = [
        { value: "", label: t("recommendForm.choose") },
        ...(choices?.residence_status ?? []).map((value) => ({ value, label: value })),
    ];

    const renderFacts = (item) => (
        <>
            <div>
                <dt>{t("recommendAccount.rate")}</dt>
                <dd>
                    {t("recommendAccount.rateValue", {
                        rate: item.base_rate,
                        type: item.rate_type,
                    })}
                </dd>
            </div>
            <div>
                <dt>{t("recommendAccount.period")}</dt>
                <dd>{t("recommendAccount.termOption", { count: item.term_months })}</dd>
            </div>
            <div>
                <dt>{t("recommendAccount.joinWay")}</dt>
                <dd>
                    {item.join_way}
                    {item.visit_required && ` · ${t("recommendAccount.visitRequired")}`}
                </dd>
            </div>
        </>
    );

    const shownItems = result ? result.groups.flatMap((group) => group.items) : [];
    const month = result ? `${result.base_month.slice(0, 4)}.${result.base_month.slice(4)}` : "";

    return (
        <div className="page-stack">
            <section className="panel" aria-labelledby="account-recommend-title">
                <h2 id="account-recommend-title">{t("recommendAccount.title")}</h2>
                <p className="form-help">{t("recommendAccount.description")}</p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.step}>
                        <h3>{t("recommendAccount.gateTitle")}</h3>
                        <ChoiceGroup
                            name="account-own"
                            legend={t("recommendAccount.ownAccount")}
                            value={form.own_account}
                            options={yesNo}
                            onChange={(value) => update("own_account", value)}
                        />
                    </div>

                    {noAccount ? (
                        <div className={styles.callout} role="status">
                            <h3>{t("recommendAccount.noAccountTitle")}</h3>
                            <p>{t("recommendAccount.noAccountBody")}</p>
                            <Link to="/service/consultation" className="button">
                                {t("recommendAccount.noAccountAction")}
                            </Link>
                        </div>
                    ) : !form.own_account ? null : choicesError ? (
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
                                <div className={`form-field ${styles.group}`}>
                                    <span id="account-residence-label">
                                        {t("recommendForm.residenceStatus")}
                                    </span>
                                    <div className={styles.select}>
                                        <SelectBox
                                            id="account-residence"
                                            labelledBy="account-residence-label"
                                            value={form.residence_status}
                                            options={residenceOptions}
                                            onChange={(value) => update("residence_status", value)}
                                        />
                                    </div>
                                </div>
                                <ChoiceGroup
                                    name="account-visit"
                                    legend={t("recommendAccount.visit")}
                                    value={form.visit}
                                    options={visitOptions}
                                    onChange={(value) => update("visit", value)}
                                />
                            </div>

                            <div className={styles.step}>
                                <h3>{t("recommendAccount.fastTitle")}</h3>
                                <ChoiceGroup
                                    name="account-purpose"
                                    legend={t("recommendAccount.purpose")}
                                    value={form.purpose}
                                    options={purposeOptions}
                                    onChange={(value) => update("purpose", value)}
                                />
                                <ChoiceGroup
                                    name="account-term"
                                    legend={t("recommendAccount.term")}
                                    value={form.term}
                                    options={termOptions}
                                    onChange={(value) => update("term", value)}
                                    help={t("recommendAccount.termNotice")}
                                />
                                <ChoiceGroup
                                    name="account-institution"
                                    legend={t("recommendAccount.institution")}
                                    value={form.institution}
                                    options={institutionOptions}
                                    onChange={(value) => update("institution", value)}
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
                        </>
                    )}
                </form>
            </section>

            {submitted && (
                <section
                    ref={resultsRef}
                    className={styles.results}
                    aria-labelledby="account-results-title"
                    aria-busy={loading}
                >
                    <h2 id="account-results-title">{t("recommendForm.resultsTitle")}</h2>

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

                            <InterestChart
                                items={shownItems}
                                purpose={result.input.purpose}
                                term={result.input.term}
                            />

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
                >
                    <p className={styles.estimate}>
                        {result.input.purpose === "예금"
                            ? t("recommendAccount.chartDeposit", { term: result.input.term })
                            : t("recommendAccount.chartSaving", { term: result.input.term })}
                        {" · "}
                        {t("recommendAccount.interest")}{" "}
                        <strong>
                            {t("recommendAccount.interestValue", {
                                amount: estimateInterest(
                                    result.input.purpose,
                                    selected.item.base_rate,
                                    selected.item.rate_type,
                                    result.input.term,
                                ).toLocaleString("ko-KR"),
                            })}
                        </strong>
                    </p>
                </ProductDialog>
            )}
        </div>
    );
}
