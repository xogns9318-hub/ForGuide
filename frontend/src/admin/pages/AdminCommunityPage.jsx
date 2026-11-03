import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
    getAdminCommunityContents,
    updateAdminCommunityModeration,
} from "../../api/adminApi.js";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import styles from "../../styles/adminCommunity.module.css";

const PAGE_SIZE = 20;

function getContentKey(content) {
    return `${content.resourceType}:${content.resourceId}`;
}

export default function AdminCommunityPage() {
    const { t, i18n } = useTranslation();

    const [contents, setContents] = useState([]);
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
                                        {content.content}
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