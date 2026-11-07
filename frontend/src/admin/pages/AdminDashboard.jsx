import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../api/adminApi.js";
import styles from "./AdminDashboard.module.css";

export default function AdminDashboard() {
    const { t } = useTranslation();
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await getAdminDashboard();
            setDashboard(response);
        } catch (requestError) {
            setError(requestError?.message || t("admin.dashboard.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    const metrics = dashboard
        ? [
              {
                  key: "memberCount",
                  label: t("admin.dashboard.metrics.members"),
                  value: dashboard.memberCount,
              },
              {
                  key: "postCount",
                  label: t("admin.dashboard.metrics.posts"),
                  value: dashboard.postCount,
              },
              {
                  key: "commentCount",
                  label: t("admin.dashboard.metrics.comments"),
                  value: dashboard.commentCount,
              },
          ]
        : [];

    return (
        <section className={styles.page} aria-labelledby="admin-dashboard-title">
            <header className={styles.heading}>
                <p className={styles.eyebrow}>{t("admin.dashboard.eyebrow")}</p>
                <h1 id="admin-dashboard-title">{t("admin.dashboard.title")}</h1>
                <p>{t("admin.dashboard.description")}</p>
            </header>

            {isLoading && (
                <p className={styles.stateMessage} role="status">
                    {t("admin.dashboard.loading")}
                </p>
            )}

            {!isLoading && error && (
                <div className={styles.stateMessage} role="alert">
                    <p>{error}</p>
                    <button type="button" className="button" onClick={loadDashboard}>
                        {t("admin.dashboard.retry")}
                    </button>
                </div>
            )}

            {!isLoading && !error && (
                <>
                    <div className={styles.metricGrid}>
                        {metrics.map((metric) => (
                            <article key={metric.key} className={styles.metricCard}>
                                <p>{metric.label}</p>
                                <strong>{Number(metric.value || 0).toLocaleString()}</strong>
                            </article>
                        ))}
                    </div>

                    <section
                        className={styles.managementSection}
                        aria-labelledby="admin-management-title"
                    >
                        <h2 id="admin-management-title">{t("admin.dashboard.management.title")}</h2>

                        <div className={styles.managementGrid}>
                            <Link
                                className={styles.managementCard}
                                to="/admin/community"
                            >
                                <strong>
                                    {t("admin.dashboard.management.community.title",)}
                                </strong>
                                <span>
                                    {t("admin.dashboard.management.community.description",)}
                                </span>
                            </Link>

                            <Link className={styles.managementCard} to="/admin/inquiries">
                                <strong>{t("admin.dashboard.management.inquiries.title")}</strong>
                                <span>{t("admin.dashboard.management.inquiries.description")}</span>
                            </Link>

                            <Link className={styles.managementCard} to="/admin/members">
                                <strong>{t("admin.dashboard.management.members.title")}</strong>
                                <span>{t("admin.dashboard.management.members.description")}</span>
                            </Link>

                            <Link className={styles.managementCard} to="/admin/recommendation-usage">
                                <strong>{t("admin.recommendationUsage.dashboardTitle")}</strong>
                                <span>{t("admin.recommendationUsage.dashboardDescription")}</span>
                            </Link>
                        </div>
                    </section>
                </>
            )}
        </section>
    );
}
