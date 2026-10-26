import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "../recommend.module.css";

const PREVIEW_COUNT = 5;

const itemKey = (item) =>
    [item.purpose, item.product_id ?? `${item.company}-${item.product_name}`].join("-");

function ProductCard({ item, renderFacts, onDetail, muted = false }) {
    const { t } = useTranslation();
    const reasonKeys = muted ? (item.mismatch_reasons ?? []) : (item.reasons ?? []);

    return (
        <article className={`panel ${styles.card} ${muted ? styles.muted : ""}`}>
            <p className={styles.company}>{item.company}</p>
            <h4>{item.product_name}</h4>
            <dl className={styles.facts}>{renderFacts(item)}</dl>

            {reasonKeys.length > 0 && (
                <ul className={styles.reasons}>
                    {reasonKeys.map((key) => (
                        <li key={key}>
                            {t(
                                muted
                                    ? `recommendResult.mismatchReasons.${key}`
                                    : `recommendResult.reasons.${key}`,
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {!muted && item.check_reasons?.length > 0 && (
                <ul className={styles.checks}>
                    {item.check_reasons.map((key) => (
                        <li key={key}>
                            {t(`recommendResult.checkReasons.${key}`, { regions: "" })}
                        </li>
                    ))}
                </ul>
            )}

            {item.more_from_company > 0 && (
                <p className={styles.more}>
                    {t("recommendResult.moreFromCompany", { count: item.more_from_company })}
                </p>
            )}

            {!muted && (
                <div className={styles.cardActions}>
                    <button type="button" className="button" onClick={() => onDetail(item)}>
                        {t("recommendForm.detail")}
                    </button>
                </div>
            )}
        </article>
    );
}

function Group({ group, renderFacts, onDetail }) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const items = expanded ? group.items : group.items.slice(0, PREVIEW_COUNT);

    return (
        <section className={styles.resultGroup} aria-labelledby={`recommend-group-${group.key}`}>
            <div className={styles.groupHeading}>
                <h3 id={`recommend-group-${group.key}`}>
                    {group.title ?? t(`recommendResult.groups.${group.key}`)}
                </h3>
                <span className="text-muted">
                    {group.companies
                        ? t("recommendForm.groupCount", {
                              companies: group.companies,
                              total: group.total,
                          })
                        : t("recommendForm.productCount", { total: group.total })}
                </span>
            </div>
            {group.guide && (
                <p className={styles.guide}>{t(`recommendResult.guides.${group.guide}`)}</p>
            )}

            <div className={styles.grid}>
                {items.map((item) => (
                    <ProductCard
                        key={itemKey(item)}
                        item={item}
                        renderFacts={renderFacts}
                        onDetail={(selected) => onDetail(selected, group)}
                    />
                ))}
            </div>

            {group.items.length > PREVIEW_COUNT && (
                <div className="form-actions">
                    <button
                        type="button"
                        className="button"
                        onClick={() => setExpanded((previous) => !previous)}
                    >
                        {expanded ? t("recommendForm.showLess") : t("recommendForm.showMore")}
                    </button>
                </div>
            )}
        </section>
    );
}

export default function ResultGroups({ groups, mismatch, separate, renderFacts, onDetail }) {
    const { t } = useTranslation();
    const visible = groups.filter((group) => group.items.length > 0);

    return (
        <>
            {visible.length === 0 && <p role="status">{t("recommendForm.empty")}</p>}

            {visible.map((group) => (
                <Group
                    key={group.key}
                    group={group}
                    renderFacts={renderFacts}
                    onDetail={onDetail}
                />
            ))}

            {separate?.length > 0 && (
                <section className={styles.separate} aria-labelledby="recommend-separate-title">
                    <div>
                        <h3 id="recommend-separate-title">{t("recommendResult.separate.title")}</h3>
                        <p className="text-muted">{t("recommendResult.separate.description")}</p>
                    </div>
                    {separate.map((group) => (
                        <Group
                            key={group.key}
                            group={{ ...group, title: t(`recommendResult.separate.${group.key}`) }}
                            renderFacts={renderFacts}
                            onDetail={onDetail}
                        />
                    ))}
                </section>
            )}

            {mismatch?.items.length > 0 && (
                <details className={styles.mismatch}>
                    <summary>
                        {t("recommendForm.mismatchToggle", { count: mismatch.total })}
                    </summary>
                    <div className={styles.grid}>
                        {mismatch.items.map((item) => (
                            <ProductCard
                                key={itemKey(item)}
                                item={item}
                                renderFacts={renderFacts}
                                muted
                            />
                        ))}
                    </div>
                </details>
            )}
        </>
    );
}
