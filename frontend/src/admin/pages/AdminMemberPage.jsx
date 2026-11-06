import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
    getAdminMembers,
    updateAdminMemberStatus,
} from "../../api/adminApi.js";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import { formatDateTime } from "../../utils/formatDateTime.js";
import styles from "../../styles/adminMember.module.css";

const PAGE_SIZE = 20;

export default function AdminMemberPage() {
    const { t, i18n } = useTranslation();
    const [searchParams] = useSearchParams();
    const initialKeyword = searchParams.get("keyword")?.trim() || "";

    const [members, setMembers] = useState([]);
    const [memberStatus, setMemberStatus] = useState("");
    const [keywordInput, setKeywordInput] = useState(initialKeyword);
    const [keyword, setKeyword] = useState(initialKeyword);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [listError, setListError] = useState("");
    const [updatingMemberId, setUpdatingMemberId] = useState(null);
    const [updateResult, setUpdateResult] = useState({
        memberId: null,
        error: "",
        success: "",
    });

    const cursorMemberIdRef = useRef(null);
    const isLoadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    // 상태·검색어·커서 조건에 맞는 회원만 필요한 만큼 조회한다.
    const loadMembers = useCallback(async ({ reset = false } = {}) => {
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
            cursorMemberIdRef.current = null;
            hasMoreRef.current = true;
            setHasMore(true);
        }

        try {
            const response = await getAdminMembers({
                cursorMemberId: cursorMemberIdRef.current,
                memberStatus: memberStatus || null,
                keyword: keyword || null,
                size: PAGE_SIZE,
            });
            const received = Array.isArray(response) ? response : [];

            setMembers((previous) => {
                if (reset) {
                    return received;
                }

                const existingIds = new Set(
                    previous.map((member) => member.memberId),
                );

                return [
                    ...previous,
                    ...received.filter(
                        (member) =>
                            !existingIds.has(member.memberId),
                    ),
                ];
            });

            const lastMember = received.at(-1);

            if (lastMember) {
                cursorMemberIdRef.current =
                    lastMember.memberId;
            }

            const nextHasMore = received.length === PAGE_SIZE;

            hasMoreRef.current = nextHasMore;
            setHasMore(nextHasMore);
        } catch (requestError) {
            setListError(
                requestError?.message ||
                t("admin.members.loadError"),
            );
        } finally {
            isLoadingRef.current = false;
            setIsLoading(false);
        }
    }, [keyword, memberStatus, t]);

    useEffect(() => {
        void loadMembers({ reset: true });
    }, [loadMembers]);

    const observerTarget = useInfiniteScroll({
        enabled: hasMore && !isLoading && !listError,
        onLoadMore: loadMembers,
    });

    function handleSearchSubmit(event) {
        event.preventDefault();

        const nextKeyword = keywordInput.trim();

        setUpdateResult({
            memberId: null,
            error: "",
            success: "",
        });

        if (nextKeyword === keyword) {
            void loadMembers({ reset: true });
            return;
        }

        setKeyword(nextKeyword);
    }

    function handleStatusFilterChange(event) {
        setMemberStatus(event.target.value);
        setUpdateResult({
            memberId: null,
            error: "",
            success: "",
        });
    }

    async function handleMemberStatusChange(member) {
        const nextStatus = member.memberStatus === "SUSPENDED"
            ? "ACTIVE"
            : "SUSPENDED";

        setUpdatingMemberId(member.memberId);
        setUpdateResult({
            memberId: null,
            error: "",
            success: "",
        });

        try {
            const updatedMember = await updateAdminMemberStatus(
                member.memberId,
                nextStatus,
            );

            setMembers((previous) =>
                previous
                    .map((item) =>
                        item.memberId === updatedMember.memberId
                            ? updatedMember
                            : item,
                    )
                    .filter((item) =>
                        !memberStatus ||
                        item.memberStatus === memberStatus,
                    ),
            );

            setUpdateResult({
                memberId: member.memberId,
                error: "",
                success: nextStatus === "SUSPENDED"
                    ? t("admin.members.suspendSuccess")
                    : t("admin.members.activateSuccess"),
            });
        } catch (requestError) {
            setUpdateResult({
                memberId: member.memberId,
                error: requestError?.message ||
                    t("admin.members.updateError"),
                success: "",
            });
        } finally {
            setUpdatingMemberId(null);
        }
    }

    return (
        <section
            className={styles.page}
            aria-labelledby="admin-member-title"
        >
            <header className={styles.heading}>
                <p className={styles.eyebrow}>
                    {t("admin.members.eyebrow")}
                </p>
                <h1 id="admin-member-title">
                    {t("admin.members.title")}
                </h1>
                <p>{t("admin.members.description")}</p>
            </header>

            <form
                className={styles.filters}
                onSubmit={handleSearchSubmit}
            >
                <label className={styles.filterField}>
                    <span>{t("admin.members.statusLabel")}</span>
                    <select
                        value={memberStatus}
                        onChange={handleStatusFilterChange}
                    >
                        <option value="">
                            {t("admin.members.statusAll")}
                        </option>
                        <option value="ACTIVE">
                            {t("admin.members.statusActive")}
                        </option>
                        <option value="SUSPENDED">
                            {t("admin.members.statusSuspended")}
                        </option>
                    </select>
                </label>

                <label className={styles.searchField}>
                    <span>{t("admin.members.searchLabel")}</span>
                    <input
                        value={keywordInput}
                        onChange={(event) =>
                            setKeywordInput(event.target.value)
                        }
                        placeholder={t(
                            "admin.members.searchPlaceholder",
                        )}
                    />
                </label>

                <button type="submit" className="button">
                    {t("admin.members.search")}
                </button>
            </form>

            {isLoading && members.length === 0 && (
                <p className={styles.stateMessage}>
                    {t("admin.members.loading")}
                </p>
            )}

            {!isLoading && listError && (
                <div className={styles.stateMessage} role="alert">
                    <p>{listError}</p>
                    <button
                        type="button"
                        className="button"
                        onClick={() =>
                            loadMembers({
                                reset: members.length === 0,
                            })
                        }
                    >
                        {t("admin.members.retry")}
                    </button>
                </div>
            )}

            {!isLoading && !listError && members.length === 0 && (
                <p className={styles.stateMessage}>
                    {t("admin.members.empty")}
                </p>
            )}

            {members.length > 0 && (
                <ul className={styles.memberList}>
                    {members.map((member) => {
                        const isSuspended =
                            member.memberStatus === "SUSPENDED";
                        const isUpdating =
                            updatingMemberId === member.memberId;
                        const isAdmin = member.role === "ADMIN";

                        return (
                            <li
                                key={member.memberId}
                                className={styles.memberItem}
                            >
                                <div className={styles.memberInfo}>
                                    <div className={styles.memberHeading}>
                                        <strong>
                                            {member.nickname ||
                                                member.name ||
                                                member.loginId}
                                        </strong>
                                        <span
                                            className={
                                                isSuspended
                                                    ? styles.suspended
                                                    : styles.active
                                            }
                                        >
                                            {t(
                                                `admin.members.status.${member.memberStatus}`,
                                            )}
                                        </span>
                                        <span className={styles.role}>
                                            {t(
                                                `admin.members.role.${member.role}`,
                                            )}
                                        </span>
                                    </div>

                                    <p>
                                        {member.loginId} · {member.email}
                                    </p>

                                    <time dateTime={member.createdAt}>
                                        {t("admin.members.joinedAt")}:{" "}
                                        {formatDateTime(
                                            member.createdAt,
                                            i18n.language,
                                        )}
                                    </time>
                                </div>

                                {!isAdmin && (
                                    <button
                                        type="button"
                                        className={
                                            isSuspended
                                                ? "button button-primary"
                                                : "button"
                                        }
                                        onClick={() =>
                                            handleMemberStatusChange(member)
                                        }
                                        disabled={isUpdating}
                                    >
                                        {isUpdating
                                            ? t("admin.members.updating")
                                            : isSuspended
                                                ? t("admin.members.activate")
                                                : t("admin.members.suspend")}
                                    </button>
                                )}

                                {updateResult.memberId ===
                                    member.memberId &&
                                    updateResult.error && (
                                        <p
                                            className={styles.itemError}
                                            role="alert"
                                        >
                                            {updateResult.error}
                                        </p>
                                    )}

                                {updateResult.memberId ===
                                    member.memberId &&
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

            {isLoading && members.length > 0 && (
                <p className={styles.moreLoading}>
                    {t("admin.members.loading")}
                </p>
            )}

            <div ref={observerTarget} aria-hidden="true" />
        </section>
    );
}
