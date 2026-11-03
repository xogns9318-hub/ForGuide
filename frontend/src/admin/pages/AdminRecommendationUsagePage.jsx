import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { getAdminRecommendationUsage } from "../../api/adminApi.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import styles from "../../styles/adminRecommendationUsage.module.css";

const PERIOD_OPTIONS = [7, 30, 90];

function formatUsageDate(usageDate, language) {
    if (!usageDate) {
        return "";
    }

    return new Intl.DateTimeFormat(language, {
        month: "numeric",
        day: "numeric",
    }).format(new Date(`${usageDate}T00:00:00`));
}

export default function AdminRecommendationUsagePage() {
    const { t, i18n } = useTranslation();

    const [periodDays, setPeriodDays] = useState(30);
    const [usage, setUsage] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadUsage = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await getAdminRecommendationUsage(periodDays);
            setUsage(response);
        } catch (requestError) {
            setError(
                requestError?.message ||
                t("admin.recommendationUsage.loadError"),
            );
        } finally {
            setIsLoading(false);
        }
    }, [periodDays, t]);

    useEffect(() => {
        void loadUsage();
    }, [loadUsage]);

    const summary = usage?.summary;

    const metrics = useMemo(() => {
        if (!summary) {
            return [];
        }

        return [
            {
                key: "total",
                label: t("admin.recommendationUsage.totalUsage"),
                value: summary.totalUsageCount,
            },
            {
                key: "loan",
                label: t("admin.recommendationUsage.loanUsage"),
                value: summary.loanUsageCount,
            },
            {
                key: "insurance",
                label: t("admin.recommendationUsage.insuranceUsage"),
                value: summary.insuranceUsageCount,
            },
            {
                key: "account",
                label: t("admin.recommendationUsage.accountUsage"),
                value: summary.accountUsageCount,
            },
        ];
    }, [summary, t]);

    const chartData = useMemo(
        () =>
            (usage?.dailyUsage || []).map((item) => ({
                ...item,
                label: formatUsageDate(item.usageDate, i18n.language),
            })),
        [i18n.language, usage],
    );

    return (
        <section
            className={styles.page}
            aria-labelledby="admin-recommendation-usage-title"
        >
            <header className={styles.heading}>
                <p className={styles.eyebrow}>
                    {t("admin.recommendationUsage.eyebrow")}
                </p>
                <h1 id="admin-recommendation-usage-title">
                    {t("admin.recommendationUsage.title")}
                </h1>
                <p>{t("admin.recommendationUsage.description")}</p>
            </header>

            <div
                className={styles.periodControls}
                aria-label={t("admin.recommendationUsage.periodLabel")}
            >
                <span>{t("admin.recommendationUsage.periodLabel")}</span>

                <div className={styles.periodButtons}>
                    {PERIOD_OPTIONS.map((days) => (
                        <button
                            key={days}
                            type="button"
                            className={
                                days === periodDays
                                    ? "button button-primary"
                                    : "button"
                            }
                            onClick={() => setPeriodDays(days)}
                            disabled={isLoading}
                        >
                            {t(`admin.recommendationUsage.period${days}`)}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading && !usage && (
                <p className={styles.stateMessage} role="status">
                    {t("admin.recommendationUsage.loading")}
                </p>
            )}

            {!isLoading && error && (
                <div className={styles.stateMessage} role="alert">
                    <p>{error}</p>
                    <button
                        type="button"
                        className="button"
                        onClick={loadUsage}
                    >
                        {t("admin.recommendationUsage.retry")}
                    </button>
                </div>
            )}

            {usage && !error && (
                <>
                    <div className={styles.metricGrid}>
                        {metrics.map((metric) => (
                            <article
                                key={metric.key}
                                className={styles.metricCard}
                            >
                                <p>{metric.label}</p>
                                <strong>
                                    {Number(
                                        metric.value || 0,
                                    ).toLocaleString()}
                                </strong>
                            </article>
                        ))}
                    </div>

                    <section
                        className={styles.infoSection}
                        aria-labelledby="recommendation-outcome-title"
                    >
                        <h2 id="recommendation-outcome-title">
                            {t("admin.recommendationUsage.outcomeTitle")}
                        </h2>

                        <div className={styles.outcomeGrid}>
                            <article className={styles.outcomeCard}>
                                <span>
                                    {t(
                                        "admin.recommendationUsage.productResult",
                                    )}
                                </span>
                                <strong>
                                    {Number(
                                        summary.productResultCount || 0,
                                    ).toLocaleString()}
                                </strong>
                            </article>

                            <article className={styles.outcomeCard}>
                                <span>
                                    {t(
                                        "admin.recommendationUsage.consultationRedirect",
                                    )}
                                </span>
                                <strong>
                                    {Number(
                                        summary.consultationRedirectCount || 0,
                                    ).toLocaleString()}
                                </strong>
                            </article>

                            <article className={styles.latestCard}>
                                <span>
                                    {t(
                                        "admin.recommendationUsage.latestUsedAt",
                                    )}
                                </span>
                                <strong>
                                    {summary.latestUsedAt
                                        ? formatDateTime(
                                            summary.latestUsedAt,
                                            i18n.language,
                                        )
                                        : t(
                                            "admin.recommendationUsage.emptyLatestUsedAt",
                                        )}
                                </strong>
                            </article>
                        </div>
                    </section>

                    <section
                        className={styles.chartSection}
                        aria-labelledby="recommendation-chart-title"
                    >
                        <h2 id="recommendation-chart-title">
                            {t("admin.recommendationUsage.chartTitle")}
                        </h2>

                        <div className={styles.chartWrap}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="label" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip
                                        formatter={(value, name) => [
                                            Number(value).toLocaleString(),
                                            name,
                                        ]}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="loanUsageCount"
                                        name={t(
                                            "admin.recommendationUsage.chartLoan",
                                        )}
                                        stroke="#3f7968"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="insuranceUsageCount"
                                        name={t(
                                            "admin.recommendationUsage.chartInsurance",
                                        )}
                                        stroke="#6d8fa8"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="accountUsageCount"
                                        name={t(
                                            "admin.recommendationUsage.chartAccount",
                                        )}
                                        stroke="#b48a55"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </>
            )}
        </section>
    );
}