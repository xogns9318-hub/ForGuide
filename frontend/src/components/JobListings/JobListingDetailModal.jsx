import { createPortal } from "react-dom";
import styles from "../Modal/Modal.module.css";

export default function JobListingDetailModal({ listing, onClose }) {
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
                    aria-label="상세 안내 닫기"
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
                        <h3>어떤 곳인가요?</h3>
                        <p>{listing.detail}</p>
                    </section>
                )}

                {listing.recommendedFor?.length > 0 && (
                    <section className="job-listing-detail-section">
                        <h3>이런 분들이 이용하면 좋아요</h3>

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
                        <h3>이용 전 확인</h3>

                        <p className="job-listing-detail-caution">
                            {listing.caution}
                        </p>
                    </section>
                )}

                <p className="job-listing-detail-source">
                    정보 출처: {listing.sourceName ?? "확인 필요"}
                    {" · "}
                    확인일: {listing.verifiedAt ?? "확인 필요"}
                </p>


                <div className={`${styles.actions} job-listing-detail-actions`}>
                    <a
                        className="button button-primary"
                        href={listing.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        공식 사이트 바로가기 ↗
                    </a>

                    <button
                        type="button"
                        className="button"
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>
            </section>
        </div>,
        document.body,
    );
}
