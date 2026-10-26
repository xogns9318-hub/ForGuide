import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { homepageUrl } from "../utils/interest.js";
import styles from "../recommend.module.css";

export default function ProductDialog({ item, guide, renderFacts, children, onClose }) {
    const { t } = useTranslation();
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        dialog.showModal();
        return () => dialog.close();
    }, []);

    const reasons = item.reasons ?? [];
    const checks = item.check_reasons ?? [];
    const { homepage, phone } = item.contact ?? {};

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-labelledby="recommend-dialog-title"
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const outside =
                    event.clientX < rect.left ||
                    event.clientX > rect.right ||
                    event.clientY < rect.top ||
                    event.clientY > rect.bottom;
                if (outside) onClose();
            }}
        >
            <div className={styles.dialogHeader}>
                <div>
                    <p className={styles.company}>{item.company}</p>
                    <h2 id="recommend-dialog-title">{item.product_name}</h2>
                </div>
                <button type="button" className="button" onClick={onClose} autoFocus>
                    {t("recommendForm.close")}
                </button>
            </div>

            <div className={styles.dialogBody}>
                <dl className={styles.facts}>{renderFacts(item)}</dl>
                {children}

                {reasons.length > 0 && (
                    <section>
                        <h3>{t("recommendForm.reasonsTitle")}</h3>
                        <ul className={styles.reasons}>
                            {reasons.map((key) => (
                                <li key={key}>{t(`recommendResult.reasons.${key}`)}</li>
                            ))}
                        </ul>
                    </section>
                )}

                {checks.length > 0 && (
                    <section>
                        <h3>{t("recommendForm.checksTitle")}</h3>
                        <ul className={styles.checks}>
                            {checks.map((key) => (
                                <li key={key}>
                                    {t(`recommendResult.checkReasons.${key}`, { regions: "" })}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section>
                    <h3>{t("recommendForm.nextTitle")}</h3>
                    {guide && <p>{t(`recommendResult.guides.${guide}`)}</p>}
                    {homepage || phone ? (
                        <div className={styles.links}>
                            {homepage && (
                                <a
                                    href={homepageUrl(homepage)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t("recommendForm.homepage")}
                                </a>
                            )}
                            {phone && (
                                <a href={`tel:${phone}`}>
                                    {t("recommendForm.phone")} {phone}
                                </a>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted">{t("recommendForm.noContact")}</p>
                    )}
                </section>
            </div>
        </dialog>
    );
}
