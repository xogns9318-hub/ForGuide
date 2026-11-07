import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    getAdminCommunityContents,
    getAdminCommunityReports,
    getAdminCommunityReportImages,
    updateAdminCommunityModeration,
    getAdminCommunityReportImageBlob,
    dismissAdminCommunityReport,
    translateAdminCommunityContent,
} from "../api/adminApi.js";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import styles from "./AdminCommunityPage.module.css";

const PAGE_SIZE = 20;

function getContentKey(content) {
    return `${content.resourceType}:${content.resourceId}`;
}

export default function AdminCommunityPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [contents, setContents] = useState([]);
    const [translatedContents, setTranslatedContents] = useState({});
    const targetLanguage = (
        i18n.resolvedLanguage || i18n.language || "ko"
    ).split("-")[0];
    const translationRequestsRef = useRef(new Set());
    const [reports, setReports] = useState([]);
    const [isReportsLoading, setIsReportsLoading] = useState(true);
    const [reportsError, setReportsError] = useState("");
    const [processingReportId, setProcessingReportId] = useState(null);
    const [reportActionResult, setReportActionResult] = useState({
        reportId: null,
        error: "",
        success: "",
    });
    const [openedReport, setOpenedReport] = useState(null);
    const [reportImages, setReportImages] = useState([]);
    const [isImagesLoading, setIsImagesLoading] = useState(false);
    const [imagesError, setImagesError] = useState("");
    const reportImageUrlsRef = useRef(new Set());

    const [resourceType, setResourceType] = useState("");
    const [moderationStatus, setModerationStatus] = useState("");
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [listError, setListError] = useState("");

    const [activeHideKey, setActiveHideKey] = useState(null);
    const [hideReason, setHideReason] = useState("");
    const [updatingContentKey, setUpdatingContentKey] = useState(null);
    const [updateResult, setUpdateResult] = useState({
        contentKey: null,
        error: "",
        success: "",
    });

    const cursorCreatedAtRef = useRef(null);
    const cursorResourceTypeRef = useRef(null);
    const cursorResourceIdRef = useRef(null);
    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    const loadContents = useCallback(
        async ({ reset = false } = {}) => {
            if (
                isLoadingRef.current ||
                (!reset && !hasMoreRef.current)
            ) {
                return;
            }

            isLoadingRef.current = true;
            setIsLoading(true);
            setListError("");

            if (reset) {
                cursorCreatedAtRef.current = null;
                cursorResourceTypeRef.current = null;
                cursorResourceIdRef.current = null;
                hasMoreRef.current = true;
                setHasMore(true);
            }

            try {
                const response = await getAdminCommunityContents({
                    cursorCreatedAt: cursorCreatedAtRef.current,
                    cursorResourceType: cursorResourceTypeRef.current,
                    cursorResourceId: cursorResourceIdRef.current,
                    resourceType: resourceType || null,
                    moderationStatus: moderationStatus || null,
                    keyword: keyword || null,
                    size: PAGE_SIZE,
                });

                const received = Array.isArray(response) ? response : [];

                setContents((previous) => {
                    if (reset) {
                        return received;
                    }

                    const existingKeys = new Set(
                        previous.map(getContentKey),
                    );

                    return [
                        ...previous,
                        ...received.filter(
                            (content) =>
                                !existingKeys.has(
                                    getContentKey(content),
                                ),
                        ),
                    ];
                });

                const lastContent = received.at(-1);

                if (lastContent) {
                    cursorCreatedAtRef.current =
                        lastContent.createdAt;
                    cursorResourceTypeRef.current =
                        lastContent.resourceType;
                    cursorResourceIdRef.current =
                        lastContent.resourceId;
                }

                const nextHasMore = received.length === PAGE_SIZE;

                hasMoreRef.current = nextHasMore;
                setHasMore(nextHasMore);
            } catch (requestError) {
                setListError(
                    requestError?.message ||
                    t("admin.community.loadError"),
                );
            } finally {
                isLoadingRef.current = false;
                setIsLoading(false);
            }
        },
        [keyword, moderationStatus, resourceType, t],
    );

    useEffect(() => {
        void loadContents({ reset: true });
    }, [loadContents]);

    useEffect(() => {
        if (targetLanguage === "ko" || contents.length === 0) {
            return;
        }

        contents.forEach((content) => {
            const contentKey = getContentKey(content);
            const requestKey =
                `${targetLanguage}:${contentKey}:${content.contentVersion}`;

            if (
                translatedContents[targetLanguage]?.[contentKey] ||
                translationRequestsRef.current.has(requestKey)
            ) {
                return;
            }

            translationRequestsRef.current.add(requestKey);

            translateAdminCommunityContent(
                content.resourceType,
                content.resourceId,
                targetLanguage
            )
                .then((response) => {
                    // API 응답에서 실제 번역 결과 추출
                    const translatedText =
                        response?.translatedText ??
                        response?.data?.translatedText;

                    if (!translatedText) {
                        console.warn("번역 결과가 없습니다:", response);
                        return;
                    }

                    setTranslatedContents((previous) => ({
                        ...previous,
                        [targetLanguage]: {
                            ...previous[targetLanguage],
                            [contentKey]: translatedText,
                        },
                    }));
                })
                .catch((error) => {
                    console.error(
                        "관리자 커뮤니티 번역 실패:",
                        contentKey,
                        error
                    );
                })
                .finally(() => {
                    translationRequestsRef.current.delete(requestKey);
                });
        });
    }, [contents, targetLanguage, translatedContents]);

    const loadReports = useCallback(async () => {
        setIsReportsLoading(true);
        setReportsError("");

        try {
            const response = await getAdminCommunityReports();
            setReports(Array.isArray(response) ? response : []);
        } catch (requestError) {
            setReportsError(
                requestError?.message ||
                t("admin.community.reportsLoadError"),
            );
        } finally {
            setIsReportsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        void loadReports();
    }, [loadReports]);

    // 관리자 모달을 닫거나 다시 열 때 Blob 미리보기 주소를 해제한다.
    function clearReportImagePreviews() {
        reportImageUrlsRef.current.forEach((url) =>
            URL.revokeObjectURL(url),);
        reportImageUrlsRef.current.clear();
    }

    async function openReportImages(report) {
        setOpenedReport(report);
        setReportImages([]);
        setImagesError("");
        setIsImagesLoading(true);

        try {
            const response = await getAdminCommunityReportImages(
                report.reportId,
            );

            clearReportImagePreviews();

            const images = Array.isArray(response) ? response : [];

            const imagesWithPreviewUrl = await Promise.all(
                images.map(async (image) => {
                    const blob = await getAdminCommunityReportImageBlob(
                        report.reportId,
                        image.reportImageId,
                    );

                    const previewUrl = URL.createObjectURL(blob);
                    reportImageUrlsRef.current.add(previewUrl);

                    return {
                        ...image,
                        previewUrl,
                    };
                }),
            );

            setReportImages(imagesWithPreviewUrl);

        } catch (requestError) {
            setImagesError(
                requestError?.message ||
                t("admin.community.reportImagesLoadError"),
            );
        } finally {
            setIsImagesLoading(false);
        }
    }

    function closeReportImages() {
        setOpenedReport(null);
        clearReportImagePreviews();
        setReportImages([]);
        setImagesError("");
    }

    // 콘텐츠를 숨기면 같은 콘텐츠의 대기 신고도 함께 처리된다.
    async function hideReportedContent(report) {
        setProcessingReportId(report.reportId);
        setReportActionResult({
            reportId: null,
            error: "",
            success: "",
        });

        try {
            await updateAdminCommunityModeration(
                report.resourceType,
                report.resourceId,
                "HIDDEN",
                null,
            );

            await Promise.all([
                loadReports(),
                loadContents({ reset: true }),
            ]);

            setReportActionResult({
                reportId: report.reportId,
                error: "",
                success: t("admin.community.reportHiddenSuccess"),
            });
        } catch (requestError) {
            setReportActionResult({
                reportId: report.reportId,
                error:
                    requestError?.message ||
                    t("admin.community.reportActionError"),
                success: "",
            });
        } finally {
            setProcessingReportId(null);
        }
    }

    // 신고만 기각하며, 콘텐츠 자체의 공개 상태는 바꾸지 않는다.
    async function dismissReport(report) {
        setProcessingReportId(report.reportId);
        setReportActionResult({
            reportId: null,
            error: "",
            success: "",
        });

        try {
            await dismissAdminCommunityReport(report.reportId);
            await loadReports();

            setReportActionResult({
                reportId: report.reportId,
                error: "",
                success: t("admin.community.reportDismissSuccess"),
            });
        } catch (requestError) {
            setReportActionResult({
                reportId: report.reportId,
                error:
                    requestError?.message ||
                    t("admin.community.reportActionError"),
                success: "",
            });
        } finally {
            setProcessingReportId(null);
        }
    }

    // 대상 회원의 로그인 아이디를 회원 관리 검색어로 넘겨 바로 찾을 수 있게 한다.
    function openTargetMemberManagement(report) {
        const keyword = report.targetLoginId || report.targetNickname;

        navigate(
            keyword
                ? `/admin/members?keyword=${encodeURIComponent(keyword)}`
                : "/admin/members",
        );
    }

    const observerTarget = useInfiniteScroll({
        enabled: hasMore && !isLoading && !listError,
        onLoadMore: loadContents,
    });

    function handleSearchSubmit(event) {
        event.preventDefault();

        const nextKeyword = keywordInput.trim();

        setUpdateResult({
            contentKey: null,
            error: "",
            success: "",
        });

        if (nextKeyword === keyword) {
            void loadContents({ reset: true });
            return;
        }

        setKeyword(nextKeyword);
    }

    function handleFilterChange(setter) {
        return (event) => {
            setter(event.target.value);
            setUpdateResult({
                contentKey: null,
                error: "",
                success: "",
            });
        };
    }

    async function handleModerationChange(
        content,
        nextStatus,
        reason = null,
    ) {
        const contentKey = getContentKey(content);

        setUpdatingContentKey(contentKey);
        setUpdateResult({
            contentKey: null,
            error: "",
            success: "",
        });

        try {
            const updatedContent =
                await updateAdminCommunityModeration(
                    content.resourceType,
                    content.resourceId,
                    nextStatus,
                    reason,
                );

            setContents((previous) =>
                previous
                    .map((item) =>
                        getContentKey(item) === contentKey
                            ? updatedContent
                            : item,
                    )
                    .filter(
                        (item) =>
                            !moderationStatus ||
                            item.moderationStatus ===
                            moderationStatus,
                    ),
            );

            setActiveHideKey(null);
            setHideReason("");

            setUpdateResult({
                contentKey,
                error: "",
                success:
                    nextStatus === "HIDDEN"
                        ? t("admin.community.hideSuccess")
                        : t("admin.community.restoreSuccess"),
            });
        } catch (requestError) {
            setUpdateResult({
                contentKey,
                error:
                    requestError?.message ||
                    t("admin.community.updateError"),
                success: "",
            });
        } finally {
            setUpdatingContentKey(null);
        }
    }

    return (
        <section
            className={styles.page}
            aria-labelledby="admin-community-title"
        >
            <header className={styles.heading}>
                <p className={styles.eyebrow}>
                    {t("admin.community.eyebrow")}
                </p>
                <h1 id="admin-community-title">
                    {t("admin.community.title")}
                </h1>
                <p>{t("admin.community.description")}</p>
            </header>

            <form
                className={styles.filters}
                onSubmit={handleSearchSubmit}
            >
                <label className={styles.filterField}>
                    <span>{t("admin.community.resourceTypeLabel")}</span>
                    <select
                        value={resourceType}
                        onChange={handleFilterChange(setResourceType)}
                    >
                        <option value="">
                            {t("admin.community.resourceTypeAll")}
                        </option>
                        <option value="POST">
                            {t("admin.community.resourceTypePost")}
                        </option>
                        <option value="COMMENT">
                            {t("admin.community.resourceTypeComment")}
                        </option>
                    </select>
                </label>

                <label className={styles.filterField}>
                    <span>{t("admin.community.statusLabel")}</span>
                    <select
                        value={moderationStatus}
                        onChange={handleFilterChange(
                            setModerationStatus,
                        )}
                    >
                        <option value="">
                            {t("admin.community.statusAll")}
                        </option>
                        <option value="VISIBLE">
                            {t("admin.community.statusVisible")}
                        </option>
                        <option value="HIDDEN">
                            {t("admin.community.statusHidden")}
                        </option>
                    </select>
                </label>

                <label className={styles.searchField}>
                    <span>{t("admin.community.searchLabel")}</span>
                    <input
                        value={keywordInput}
                        onChange={(event) =>
                            setKeywordInput(event.target.value)
                        }
                        placeholder={t(
                            "admin.community.searchPlaceholder",
                        )}
                    />
                </label>

                <button type="submit" className="button">
                    {t("admin.community.search")}
                </button>
            </form>

            <section
                className={styles.reportSection}
                aria-labelledby="admin-community-reports-title"
            >
                <div className={styles.reportSectionHeading}>
                    <h2 id="admin-community-reports-title">
                        {t("admin.community.reportsTitle")}
                    </h2>

                    <button
                        type="button"
                        className="button"
                        onClick={loadReports}
                        disabled={isReportsLoading}
                    >
                        {t("admin.community.retry")}
                    </button>
                </div>

                {isReportsLoading && (
                    <p className={styles.stateMessage}>
                        {t("admin.community.reportsLoading")}
                    </p>
                )}

                {!isReportsLoading && reportsError && (
                    <p className={styles.itemError} role="alert">
                        {reportsError}
                    </p>
                )}

                {!isReportsLoading &&
                    !reportsError &&
                    reports.length === 0 && (
                        <p className={styles.stateMessage}>
                            {t("admin.community.reportsEmpty")}
                        </p>
                    )}

                {!isReportsLoading &&
                    !reportsError &&
                    reports.length > 0 && (
                        <ul className={styles.reportList}>
                            {reports.map((report) => (
                                <li
                                    key={report.reportId}
                                    className={styles.reportItem}
                                >
                                    <div>
                                        <strong>
                                            {report.resourceType === "POST"
                                                ? t(
                                                    "admin.community.resourceTypePost",
                                                )
                                                : t(
                                                    "admin.community.resourceTypeComment",
                                                )}
                                        </strong>

                                        <p>
                                            {t(
                                                "admin.community.reportReasonLabel",
                                            )}
                                            :{" "}
                                            {t(
                                                `community.report.reasons.${report.reportReason}`,
                                            )}
                                        </p>

                                        <p>
                                            {t(
                                                "admin.community.reporterLabel",
                                            )}
                                            :{" "}
                                            {report.reporterNickname ||
                                                report.reporterLoginId}
                                        </p>

                                        <p>
                                            {t("admin.community.targetLabel")}:{" "}
                                            {report.targetNickname || report.targetLoginId || "-"}
                                        </p>

                                        <p>
                                            {t("admin.community.reportStatusLabel")}:{" "}
                                            {t(`admin.community.reportStatus.${report.reportStatus}`)}
                                        </p>

                                        {report.handledAt && (
                                            <p>
                                                {t("admin.community.handledAtLabel")}:{" "}
                                                {formatDateTime(report.handledAt, i18n.language)}
                                            </p>
                                        )}
                                    </div>

                                    <div className={styles.reportActions}>
                                        <button
                                            type="button"
                                            className="button"
                                            onClick={() => openReportImages(report)}
                                        >
                                            {t("admin.community.viewEvidence")}
                                        </button>

                                        <button
                                            type="button"
                                            className="button"
                                            onClick={() =>
                                                openTargetMemberManagement(report)
                                            }
                                        >
                                            {t(
                                                "admin.community.openMemberManagement",
                                            )}
                                        </button>

                                        {report.reportStatus === "PENDING" && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="button"
                                                    onClick={() => hideReportedContent(report)}
                                                    disabled={processingReportId === report.reportId}
                                                >
                                                    {processingReportId === report.reportId
                                                        ? t("admin.community.updating")
                                                        : t("admin.community.hideReportedContent")}
                                                </button>

                                                <button
                                                    type="button"
                                                    className="button"
                                                    onClick={() => dismissReport(report)}
                                                    disabled={processingReportId === report.reportId}
                                                >
                                                    {processingReportId === report.reportId
                                                        ? t("admin.community.updating")
                                                        : t("admin.community.dismissReport")}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {reportActionResult.reportId === report.reportId &&
                                        reportActionResult.error && (
                                            <p className={styles.itemError} role="alert">
                                                {reportActionResult.error}
                                            </p>
                                        )}

                                    {reportActionResult.reportId === report.reportId &&
                                        reportActionResult.success && (
                                            <p className={styles.itemSuccess} role="status">
                                                {reportActionResult.success}
                                            </p>
                                        )}
                                </li>
                            ))}
                        </ul>
                    )}
            </section>

            {openedReport && (
                <div
                    className={styles.imageModalBackdrop}
                    role="presentation"
                    onMouseDown={closeReportImages}
                >
                    <section
                        className={styles.imageModal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-evidence-title"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className={styles.imageModalHeading}>
                            <h2 id="report-evidence-title">
                                {t("admin.community.evidenceTitle")}
                            </h2>

                            <button
                                type="button"
                                className="button"
                                onClick={closeReportImages}
                            >
                                {t("admin.community.close")}
                            </button>
                        </div>

                        {isImagesLoading && (
                            <p className={styles.stateMessage}>
                                {t("admin.community.evidenceLoading")}
                            </p>
                        )}

                        {!isImagesLoading && imagesError && (
                            <p className={styles.itemError} role="alert">
                                {imagesError}
                            </p>
                        )}

                        {!isImagesLoading &&
                            !imagesError &&
                            reportImages.length === 0 && (
                                <p className={styles.stateMessage}>
                                    {t("admin.community.evidenceEmpty")}
                                </p>
                            )}

                        {!isImagesLoading &&
                            !imagesError &&
                            reportImages.length > 0 && (
                                <ul className={styles.evidenceImageList}>
                                    {reportImages.map((image) => (
                                        <li key={image.reportImageId}>
                                            <img
                                                src={image.previewUrl}
                                                alt={t(
                                                    "admin.community.evidenceImageAlt",
                                                    {
                                                        index: image.displayOrder + 1,
                                                    },
                                                )}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                    </section>
                </div>
            )}

            {isLoading && contents.length === 0 && (
                <p className={styles.stateMessage}>
                    {t("admin.community.loading")}
                </p>
            )}

            {!isLoading && listError && (
                <div className={styles.stateMessage} role="alert">
                    <p>{listError}</p>
                    <button
                        type="button"
                        className="button"
                        onClick={() =>
                            loadContents({
                                reset: contents.length === 0,
                            })
                        }
                    >
                        {t("admin.community.retry")}
                    </button>
                </div>
            )}

            {!isLoading && !listError && contents.length === 0 && (
                <p className={styles.stateMessage}>
                    {t("admin.community.empty")}
                </p>
            )}

            {contents.length > 0 && (
                <ul className={styles.contentList}>
                    {contents.map((content) => {
                        const contentKey = getContentKey(content);
                        const isHidden =
                            content.moderationStatus === "HIDDEN";
                        const isUpdating =
                            updatingContentKey === contentKey;
                        const isHideFormOpen =
                            activeHideKey === contentKey;

                        return (
                            <li
                                key={contentKey}
                                className={styles.contentItem}
                            >
                                <div className={styles.contentInfo}>
                                    <div className={styles.contentHeading}>
                                        <span className={styles.type}>
                                            {content.resourceType === "POST"
                                                ? t(
                                                    "admin.community.resourceTypePost",
                                                )
                                                : t(
                                                    "admin.community.resourceTypeComment",
                                                )}
                                        </span>

                                        <span
                                            className={
                                                isHidden
                                                    ? styles.hidden
                                                    : styles.visible
                                            }
                                        >
                                            {isHidden
                                                ? t(
                                                    "admin.community.statusHidden",
                                                )
                                                : t(
                                                    "admin.community.statusVisible",
                                                )}
                                        </span>
                                    </div>

                                    <p className={styles.contentText}>
                                        {translatedContents[targetLanguage]?.[contentKey]
                                            || content.content}
                                    </p>

                                    <p className={styles.author}>
                                        {content.authorNickname ||
                                            content.authorLoginId}{" "}
                                        · {content.authorLoginId}
                                    </p>

                                    <time dateTime={content.createdAt}>
                                        {t("admin.community.createdAt")}:{" "}
                                        {formatDateTime(
                                            content.createdAt,
                                            i18n.language,
                                        )}
                                    </time>

                                    {isHidden && (
                                        <p className={styles.reason}>
                                            {t(
                                                "admin.community.reasonLabel",
                                            )}
                                            :{" "}
                                            {content.moderationReason ||
                                                t(
                                                    "admin.community.reasonNone",
                                                )}
                                        </p>
                                    )}
                                </div>

                                <div className={styles.actions}>
                                    {isHidden ? (
                                        <button
                                            type="button"
                                            className="button button-primary"
                                            onClick={() =>
                                                handleModerationChange(
                                                    content,
                                                    "VISIBLE",
                                                )
                                            }
                                            disabled={isUpdating}
                                        >
                                            {isUpdating
                                                ? t(
                                                    "admin.community.updating",
                                                )
                                                : t(
                                                    "admin.community.restore",
                                                )}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="button"
                                            onClick={() => {
                                                setActiveHideKey(contentKey);
                                                setHideReason("");
                                                setUpdateResult({
                                                    contentKey: null,
                                                    error: "",
                                                    success: "",
                                                });
                                            }}
                                            disabled={isUpdating}
                                        >
                                            {t("admin.community.hide")}
                                        </button>
                                    )}
                                </div>

                                {isHideFormOpen && (
                                    <div className={styles.reasonForm}>
                                        <label>
                                            <span>
                                                {t(
                                                    "admin.community.reasonLabel",
                                                )}
                                            </span>
                                            <textarea
                                                value={hideReason}
                                                maxLength={500}
                                                placeholder={t(
                                                    "admin.community.reasonPlaceholder",
                                                )}
                                                onChange={(event) =>
                                                    setHideReason(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </label>

                                        <div className={styles.reasonActions}>
                                            <button
                                                type="button"
                                                className="button button-primary"
                                                onClick={() =>
                                                    handleModerationChange(
                                                        content,
                                                        "HIDDEN",
                                                        hideReason,
                                                    )
                                                }
                                                disabled={isUpdating}
                                            >
                                                {isUpdating
                                                    ? t(
                                                        "admin.community.updating",
                                                    )
                                                    : t(
                                                        "admin.community.confirmHide",
                                                    )}
                                            </button>

                                            <button
                                                type="button"
                                                className="button"
                                                onClick={() => {
                                                    setActiveHideKey(null);
                                                    setHideReason("");
                                                }}
                                                disabled={isUpdating}
                                            >
                                                {t("admin.community.cancel")}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {updateResult.contentKey === contentKey &&
                                    updateResult.error && (
                                        <p
                                            className={styles.itemError}
                                            role="alert"
                                        >
                                            {updateResult.error}
                                        </p>
                                    )}

                                {updateResult.contentKey === contentKey &&
                                    updateResult.success && (
                                        <p
                                            className={styles.itemSuccess}
                                            role="status"
                                        >
                                            {updateResult.success}
                                        </p>
                                    )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {isLoading && contents.length > 0 && (
                <p className={styles.moreLoading}>
                    {t("admin.community.loading")}
                </p>
            )}

            <div ref={observerTarget} aria-hidden="true" />
        </section>
    );
}
