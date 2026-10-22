import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import styles from "../Modal/Modal.module.css";


export default function JobListingDetailModal({ listing, onClose }) {
    const { t } = useTranslation();
    // 선택한 카드가 없으면 모달 그리지 않는다.
    if  (!listing) {
        return null;
    }

    function handleBackDropClick(event) {
        // 창 바깥의 어두운 영역을 눌렀을 때만 닫는다.
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    return createPortal(
        <div
            className={styles.backdrop}
            onClick={handleBackDropClick}
        >
            <section
                className={`${styles.dialog} job-listing-detail-dialog`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="job-listing-detail-title"
            >
                <button
                    type="button"
                    className="job-listing-detail-close"
                    onClick={onClose}
                    aria-label={t("jobListings.detailModal.closeAria")}
                >
                    ×
                </button>
                <h2
                    id="job-listing-detail-title"
                    className={styles.title}
                >
                    {listing.title}
                </h2>

                {listing.detail && (
                    <section className="job-listing-detail-section">
                        <h3>{t("jobListings.detailModal.about")}</h3>
                        <p>{listing.detail}</p>
                    </section>
                )}

                {listing.recommendedFor?.length > 0 && (
                    <section className="job-listing-detail-section">
                        <h3>{t("jobListings.detailModal.recommendedFor")}</h3>

                        <ul className="job-listing-detail-recommendations">
                            {listing.recommendedFor.map((recommendation) => (
                                <li key={recommendation}>
                                    {recommendation}
                                </li>
                                ))}
                        </ul>
                    </section>
                )}

                {listing.caution && (
                    <section className="job-listing-detail-section">
                        <h3>{t("jobListings.detailModal.caution")}</h3>

                        <p className="job-listing-detail-caution">
                            {listing.caution}
                        </p>
                    </section>
                )}

                <p className="job-listing-detail-source">
                    {t("jobListings.detailModal.source")}:{" "}
                    {listing.sourceName ?? t("jobListings.detailModal.unknown")}
                    {" · "}
                    {t("jobListings.detailModal.verifiedAt")}:{" "}
                    {listing.verifiedAt ?? t("jobListings.detailModal.unknown")}
                </p>


                <div className={`${styles.actions} job-listing-detail-actions`}>
                    <a
                        className="button button-primary"
                        href={listing.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {t("jobListings.actions.openOfficialSite")}{" "}
                        <span aria-hidden="true">↗</span>
                    </a>

                    <button
                        type="button"
                        className="button"
                        onClick={onClose}
                    >
                        {t("jobListings.actions.close")}
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
