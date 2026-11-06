import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { answerAdminInquiry, getAdminInquiries } from "../../api/adminApi.js";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import InquiryImageList from "../../inquiry/components/InquiryImageList.jsx";
import { formatDateTime } from "../../utils/formatDateTime.js";
import styles from "../../styles/adminInquiry.module.css";

const PAGE_SIZE = 10;

export default function AdminInquiryPage() {
    const { t, i18n } = useTranslation();

    const [inquiries, setInquiries] = useState([]);
    const [inquiryStatus, setInquiryStatus] = useState("");
    const [answerDrafts, setAnswerDrafts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [listError, setListError] = useState("");
    const [answerResult, setAnswerResult] = useState({
        inquiryId: null,
        error: "",
        success: "",
    });
    const [answeringInquiryId, setAnsweringInquiryId] = useState(null);

    const cursorInquiryIdRef = useRef(null);
    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    // 상태 필터와 커서를 함께 서버에 전달해 필요한 문의만 읽는다.
    const loadInquiries = useCallback(
        async ({ reset = false } = {}) => {
            if (isLoadingRef.current || (!reset && !hasMoreRef.current)) {
                return;
            }

            isLoadingRef.current = true;
            setIsLoading(true);
            setListError("");

            if (reset) {
                cursorInquiryIdRef.current = null;
                hasMoreRef.current = true;
                setHasMore(true);
            }

            try {
                const response = await getAdminInquiries({
                    cursorInquiryId: cursorInquiryIdRef.current,
                    inquiryStatus: inquiryStatus || null,
                    size: PAGE_SIZE,
                });
                const received = Array.isArray(response) ? response : [];

                setInquiries((previous) => {
                    if (reset) {
                        return received;
                    }

                    const existingIds = new Set(previous.map((inquiry) => inquiry.inquiryId));

                    return [
                        ...previous,
                        ...received.filter((inquiry) => !existingIds.has(inquiry.inquiryId)),
                    ];
                });

                const lastInquiry = received.at(-1);

                if (lastInquiry) {
                    cursorInquiryIdRef.current = lastInquiry.inquiryId;
                }

                const nextHasMore = received.length === PAGE_SIZE;

                hasMoreRef.current = nextHasMore;
                setHasMore(nextHasMore);
            } catch (requestError) {
                setListError(requestError?.message || t("admin.inquiries.loadError"));
            } finally {
                isLoadingRef.current = false;
                setIsLoading(false);
            }
        },
        [inquiryStatus, t],
    );

    useEffect(() => {
        void loadInquiries({ reset: true });
    }, [loadInquiries]);

    const observerTarget = useInfiniteScroll({
        enabled: hasMore && !isLoading && !listError,
        onLoadMore: loadInquiries,
    });

    function handleFilterChange(event) {
        setInquiryStatus(event.target.value);
        setAnswerResult({
            inquiryId: null,
            error: "",
            success: "",
        });
    }

    function handleAnswerDraftChange(inquiryId, value) {
        setAnswerDrafts((previous) => ({
            ...previous,
            [inquiryId]: value,
        }));
    }

    async function handleAnswerSubmit(event, inquiryId) {
        event.preventDefault();

        const answerContent = answerDrafts[inquiryId]?.trim() || "";

        if (!answerContent) {
            setAnswerResult({
                inquiryId,
                error: t("admin.inquiries.answerRequired"),
                success: "",
            });
            return;
        }

        setAnsweringInquiryId(inquiryId);
        setAnswerResult({
            inquiryId: null,
            error: "",
            success: "",
        });

        try {
            await answerAdminInquiry(inquiryId, answerContent);

            setAnswerDrafts((previous) => {
                const next = { ...previous };

                delete next[inquiryId];

                return next;
            });

            setAnswerResult({
                inquiryId,
                error: "",
                success: t("admin.inquiries.answerSuccess"),
            });

            await loadInquiries({ reset: true });
        } catch (requestError) {
            setAnswerResult({
                inquiryId,
                error: requestError?.message || t("admin.inquiries.answerError"),
                success: "",
            });
        } finally {
            setAnsweringInquiryId(null);
        }
    }

    return (
        <section className={styles.page} aria-labelledby="admin-inquiry-title">
            <header className={styles.heading}>
                <h1 id="admin-inquiry-title">{t("admin.inquiries.title")}</h1>
                <p>{t("admin.inquiries.description")}</p>
            </header>

            <label className={styles.filter}>
                <span>{t("inquiry.form.category")}</span>
                <select value={inquiryStatus} onChange={handleFilterChange}>
                    <option value="">{t("admin.inquiries.filter.all")}</option>
                    <option value="RECEIVED">{t("admin.inquiries.filter.received")}</option>
                    <option value="ANSWERED">{t("admin.inquiries.filter.answered")}</option>
                </select>
            </label>

            {isLoading && inquiries.length === 0 && (
                <p className={styles.stateMessage}>{t("admin.inquiries.loading")}</p>
            )}

            {!isLoading && listError && (
                <div className={styles.stateMessage} role="alert">
                    <p>{listError}</p>
                    <button
                        type="button"
                        className="button"
                        onClick={() =>
                            loadInquiries({
                                reset: inquiries.length === 0,
                            })
                        }
                    >
                        {t("admin.inquiries.retry")}
                    </button>
                </div>
            )}

            {!isLoading && !listError && inquiries.length === 0 && (
                <p className={styles.stateMessage}>{t("admin.inquiries.empty")}</p>
            )}

            {inquiries.length > 0 && (
                <ul className={styles.inquiryList}>
                    {inquiries.map((inquiry) => {
                        const isAnswered = inquiry.inquiryStatus === "ANSWERED";
                        const isAnswering = answeringInquiryId === inquiry.inquiryId;

                        return (
                            <li key={inquiry.inquiryId} className={styles.inquiryItem}>
                                <div className={styles.itemHeader}>
                                    <span
                                        className={isAnswered ? styles.answered : styles.received}
                                    >
                                        {t(`inquiry.status.${inquiry.inquiryStatus}`)}
                                    </span>
                                    <time dateTime={inquiry.createdAt}>
                                        {formatDateTime(inquiry.createdAt, i18n.language)}
                                    </time>
                                </div>

                                <p className={styles.member}>
                                    {t("admin.inquiries.member")}: {inquiry.memberNickname || "-"}
                                </p>
                                <p className={styles.category}>
                                    {t(`inquiry.category.${inquiry.inquiryCategory}`)}
                                </p>
                                <h2>{inquiry.title}</h2>

                                <p className={styles.content}>{inquiry.content}</p>
                                <InquiryImageList
                                    inquiryId={inquiry.inquiryId}
                                    images={inquiry.images}
                                    isAdmin
                                />

                                {isAnswered ? (
                                    <div className={styles.answer}>
                                        <h3>{t("inquiry.answer.title")}</h3>
                                        <p>{inquiry.answerContent}</p>
                                        <time dateTime={inquiry.answeredAt}>
                                            {formatDateTime(inquiry.answeredAt, i18n.language)}
                                        </time>
                                    </div>
                                ) : (
                                    <form
                                        className={styles.answerForm}
                                        onSubmit={(event) =>
                                            handleAnswerSubmit(event, inquiry.inquiryId)
                                        }
                                    >
                                        <label>
                                            <span>{t("admin.inquiries.answer")}</span>
                                            <textarea
                                                value={answerDrafts[inquiry.inquiryId] || ""}
                                                maxLength={5000}
                                                placeholder={t("admin.inquiries.answerPlaceholder")}
                                                onChange={(event) =>
                                                    handleAnswerDraftChange(
                                                        inquiry.inquiryId,
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>

                                        {answerResult.inquiryId === inquiry.inquiryId &&
                                            answerResult.error && (
                                                <p className={styles.error} role="alert">
                                                    {answerResult.error}
                                                </p>
                                            )}

                                        {answerResult.inquiryId === inquiry.inquiryId &&
                                            answerResult.success && (
                                                <p className={styles.success} role="status">
                                                    {answerResult.success}
                                                </p>
                                            )}

                                        <button
                                            type="submit"
                                            className="button button-primary"
                                            disabled={isAnswering}
                                        >
                                            {isAnswering
                                                ? t("admin.inquiries.submitting")
                                                : t("admin.inquiries.answer")}
                                        </button>
                                    </form>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {isLoading && inquiries.length > 0 && (
                <p className={styles.stateMessage}>{t("admin.inquiries.loading")}</p>
            )}

            <div ref={observerTarget} aria-hidden="true" />

            {!isLoading && !listError && hasMore && (
                <button type="button" className="button" onClick={() => loadInquiries()}>
                    {t("admin.inquiries.loadMore")}
                </button>
            )}
        </section>
    );
}
