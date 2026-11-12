import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    createInquiry,
    deleteMyReceivedInquiry,
    getMyInquiries,
    translateMyInquiryText,
} from "../api/inquiryApi.js";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import InquiryImageList from "../components/InquiryImageList.jsx";
import SelectBox from "../../components/SelectBox/SelectBox.jsx";
import styles from "./InquiryPage.module.css";
import { formatDateTime } from "../../utils/formatDateTime.js";
import { queueTranslation } from "../../utils/translationQueue.js";

const PAGE_SIZE = 10;

const CATEGORY_CODES = ["SERVICE", "ACCOUNT", "FINANCE", "OTHER"];

const INITIAL_FORM = {
    inquiryCategory: "SERVICE",
    title: "",
    content: "",
};

export default function InquiryPage() {
    const { t, i18n } = useTranslation();
    const targetLanguage = (i18n.resolvedLanguage || i18n.language || "ko").split("-")[0];

    const [form, setForm] = useState(INITIAL_FORM);
    const [inquiries, setInquiries] = useState([]);
    const [translatedInquiries, setTranslatedInquiries] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isListLoading, setIsListLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [formError, setFormError] = useState("");
    const [listError, setListError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
    const [deletingInquiryId, setDeletingInquiryId] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const cursorInquiryIdRef = useRef(null);
    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const translatedTitleRequestsRef = useRef(new Set());

    // 첫 조회와 다음 목록 조회가 같은 커서 규칙을 사용한다.
    const loadInquiries = useCallback(
        async ({ reset = false } = {}) => {
            if (isLoadingRef.current || (!reset && !hasMoreRef.current)) {
                return;
            }

            isLoadingRef.current = true;
            setIsListLoading(true);
            setListError("");

            if (reset) {
                cursorInquiryIdRef.current = null;
                hasMoreRef.current = true;
                setHasMore(true);
            }

            try {
                const response = await getMyInquiries({
                    cursorInquiryId: cursorInquiryIdRef.current,
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
                setListError(requestError?.message || t("inquiry.myList.loadError"));
            } finally {
                isLoadingRef.current = false;
                setIsListLoading(false);
            }
        },
        [t],
    );

    useEffect(() => {
        void loadInquiries({ reset: true });
    }, [loadInquiries]);

    useEffect(() => {
        if (targetLanguage === "ko") return;

        inquiries.forEach((inquiry) => {
            const key = `${targetLanguage}:${inquiry.inquiryId}:title`;

            if (translatedTitleRequestsRef.current.has(key)) return;

            translatedTitleRequestsRef.current.add(key);

            queueTranslation(`my-inquiry:${inquiry.inquiryId}:title:${targetLanguage}`, () =>
                translateMyInquiryText(inquiry.inquiryId, "title", targetLanguage),
            )
                .then((response) => {
                    setTranslatedInquiries((previous) => ({
                        ...previous,
                        [targetLanguage]: {
                            ...previous[targetLanguage],
                            [inquiry.inquiryId]: {
                                ...previous[targetLanguage]?.[inquiry.inquiryId],
                                title: response.translatedText,
                            },
                        },
                    }));
                })
                .catch(() => {
                    translatedTitleRequestsRef.current.delete(key);
                });
        });
    }, [inquiries, targetLanguage]);

    // 문의 내용 자동 번역
    useEffect(() => {
        if (targetLanguage === "ko") return;

        inquiries.forEach((inquiry) => {
            const key = `${targetLanguage}:${inquiry.inquiryId}:content`;

            if (translatedTitleRequestsRef.current.has(key)) return;

            translatedTitleRequestsRef.current.add(key);

            queueTranslation(`my-inquiry:${inquiry.inquiryId}:content:${targetLanguage}`, () =>
                translateMyInquiryText(inquiry.inquiryId, "content", targetLanguage),
            )
                .then((response) => {
                    setTranslatedInquiries((previous) => ({
                        ...previous,
                        [targetLanguage]: {
                            ...previous[targetLanguage],
                            [inquiry.inquiryId]: {
                                ...previous[targetLanguage]?.[inquiry.inquiryId],
                                content: response.translatedText,
                            },
                        },
                    }));
                })
                .catch(() => {
                    translatedTitleRequestsRef.current.delete(key);
                });
        });
    }, [inquiries, targetLanguage]);

    // 관리자 답변 자동 번역
    useEffect(() => {
        if (targetLanguage === "ko") return;

        inquiries.forEach((inquiry) => {
            if (!inquiry.answerContent) return;

            const key = `${targetLanguage}:${inquiry.inquiryId}:answer`;

            if (translatedTitleRequestsRef.current.has(key)) return;

            translatedTitleRequestsRef.current.add(key);

            queueTranslation(`my-inquiry:${inquiry.inquiryId}:answer:${targetLanguage}`, () =>
                translateMyInquiryText(inquiry.inquiryId, "answer", targetLanguage),
            )
                .then((response) => {
                    setTranslatedInquiries((previous) => ({
                        ...previous,
                        [targetLanguage]: {
                            ...previous[targetLanguage],
                            [inquiry.inquiryId]: {
                                ...previous[targetLanguage]?.[inquiry.inquiryId],
                                answer: response.translatedText,
                            },
                        },
                    }));
                })
                .catch(() => {
                    translatedTitleRequestsRef.current.delete(key);
                });
        });
    }, [inquiries, targetLanguage]);

    const observerTarget = useInfiniteScroll({
        enabled: hasMore && !isListLoading && !listError,
        onLoadMore: loadInquiries,
    });

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    useEffect(() => {
        const urls = imageFiles.map((image) => URL.createObjectURL(image));
        setImagePreviewUrls(urls);

        return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [imageFiles]);

    function handleImageChange(event) {
        setImageFiles(Array.from(event.target.files || []).slice(0, 4));
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setIsSubmitting(true);
        setFormError("");
        setSuccessMessage("");
        setDeleteError("");

        try {
            await createInquiry({
                inquiryCategory: form.inquiryCategory,
                title: form.title.trim(),
                content: form.content.trim(),
                images: imageFiles,
            });

            setForm(INITIAL_FORM);
            setImageFiles([]);
            setSuccessMessage(t("inquiry.form.success"));
            await loadInquiries({ reset: true });
        } catch (requestError) {
            setFormError(requestError?.message || t("inquiry.form.submitError"));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeleteInquiry(inquiryId) {
        if (!window.confirm(t("inquiry.myList.deleteConfirm"))) {
            return;
        }

        setDeletingInquiryId(inquiryId);
        setDeleteError("");

        try {
            await deleteMyReceivedInquiry(inquiryId);
            await loadInquiries({ reset: true });
        } catch (requestError) {
            setDeleteError(requestError?.message || t("inquiry.myList.deleteError"));
        } finally {
            setDeletingInquiryId(null);
        }
    }

    return (
        <section className={styles.page} aria-labelledby="inquiry-page-title">
            <header className={styles.heading}>
                <h1 id="inquiry-page-title">{t("inquiry.title")}</h1>
                <p>{t("inquiry.description")}</p>
            </header>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className={styles.categoryField}>
                    <span id="inquiry-category-label">{t("inquiry.form.category")}</span>
                    <SelectBox
                        id="inquiry-category"
                        labelledBy="inquiry-category-label"
                        value={form.inquiryCategory}
                        options={CATEGORY_CODES.map((value) => ({
                            value,
                            label: t(`inquiry.category.${value}`),
                        }))}
                        onChange={(inquiryCategory) =>
                            setForm((previous) => ({ ...previous, inquiryCategory }))
                        }
                    />
                </div>

                <label>
                    <span>{t("inquiry.form.title")}</span>
                    <input
                        name="title"
                        type="text"
                        value={form.title}
                        maxLength={200}
                        placeholder={t("inquiry.form.titlePlaceholder")}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    <span>{t("inquiry.form.content")}</span>
                    <textarea
                        name="content"
                        value={form.content}
                        maxLength={5000}
                        placeholder={t("inquiry.form.contentPlaceholder")}
                        onChange={handleChange}
                    />
                </label>

                <div className={styles.imageUpload}>
                    <label className={styles.imageUploadButton}>
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={handleImageChange}
                        />
                        <span aria-hidden="true">▧</span>
                        {t("inquiry.images.add")}
                    </label>
                    <span>{t("inquiry.images.help")}</span>
                    {imageFiles.length > 0 && (
                        <small>{t("inquiry.images.selected", { count: imageFiles.length })}</small>
                    )}
                </div>

                {imagePreviewUrls.length > 0 && (
                    <div
                        className={styles.imagePreviewList}
                        aria-label={t("inquiry.images.previewLabel")}
                    >
                        {imagePreviewUrls.map((url, index) => (
                            <img
                                key={url}
                                src={url}
                                alt={t("inquiry.images.previewAlt", { index: index + 1 })}
                            />
                        ))}
                    </div>
                )}

                {formError && (
                    <p className={styles.error} role="alert">
                        {formError}
                    </p>
                )}

                {successMessage && (
                    <p className={styles.success} role="status">
                        {successMessage}
                    </p>
                )}

                <button type="submit" className="button button-primary" disabled={isSubmitting}>
                    {isSubmitting ? t("inquiry.form.submitting") : t("inquiry.form.submit")}
                </button>
            </form>

            <section className={styles.listSection} aria-labelledby="my-inquiry-title">
                <h2 id="my-inquiry-title">{t("inquiry.myList.title")}</h2>

                {deleteError && (
                    <p className={styles.error} role="alert">
                        {deleteError}
                    </p>
                )}

                {isListLoading && inquiries.length === 0 && <p>{t("inquiry.myList.loading")}</p>}

                {!isListLoading && listError && (
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
                            {t("inquiry.myList.retry")}
                        </button>
                    </div>
                )}

                {!isListLoading && !listError && inquiries.length === 0 && (
                    <p>{t("inquiry.myList.empty")}</p>
                )}

                {inquiries.length > 0 && (
                    <ul className={styles.inquiryList}>
                        {inquiries.map((inquiry) => (
                            <li key={inquiry.inquiryId} className={styles.inquiryItem}>
                                <div className={styles.itemHeader}>
                                    <span
                                        className={
                                            inquiry.inquiryStatus === "ANSWERED"
                                                ? styles.answered
                                                : styles.received
                                        }
                                    >
                                        {t(`inquiry.status.${inquiry.inquiryStatus}`)}
                                    </span>
                                    <time dateTime={inquiry.createdAt}>
                                        {formatDateTime(inquiry.createdAt, i18n.language)}
                                    </time>
                                    {inquiry.inquiryStatus === "RECEIVED" && (
                                        <button
                                            type="button"
                                            className="button"
                                            onClick={() => handleDeleteInquiry(inquiry.inquiryId)}
                                            disabled={deletingInquiryId === inquiry.inquiryId}
                                        >
                                            {deletingInquiryId === inquiry.inquiryId
                                                ? t("inquiry.myList.deleting")
                                                : t("inquiry.myList.delete")}
                                        </button>
                                    )}
                                </div>

                                <p className={styles.category}>
                                    {t(`inquiry.category.${inquiry.inquiryCategory}`)}
                                </p>
                                <h3>
                                    {translatedInquiries[targetLanguage]?.[inquiry.inquiryId]
                                        ?.title || inquiry.title}
                                </h3>
                                <p className={styles.content}>
                                    {translatedInquiries[targetLanguage]?.[inquiry.inquiryId]
                                        ?.content || inquiry.content}
                                </p>
                                <InquiryImageList
                                    inquiryId={inquiry.inquiryId}
                                    images={inquiry.images}
                                />

                                {inquiry.answerContent && (
                                    <div className={styles.answer}>
                                        <h4>{t("inquiry.answer.title")}</h4>
                                        <p>
                                            {translatedInquiries[targetLanguage]?.[
                                                inquiry.inquiryId
                                            ]?.answer || inquiry.answerContent}
                                        </p>
                                        <time dateTime={inquiry.answeredAt}>
                                            {formatDateTime(inquiry.answeredAt, i18n.language)}
                                        </time>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {isListLoading && inquiries.length > 0 && <p>{t("inquiry.myList.loading")}</p>}

                <div ref={observerTarget} aria-hidden="true" />

                {!isListLoading && !listError && hasMore && (
                    <button type="button" className="button" onClick={() => loadInquiries()}>
                        {t("inquiry.myList.loadMore")}
                    </button>
                )}
            </section>
        </section>
    );
}
