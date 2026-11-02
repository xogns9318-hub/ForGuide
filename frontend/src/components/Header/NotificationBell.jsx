import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    getMyNotifications,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from "../../api/notificationApi.js";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import { useNotificationStream } from "../../hooks/useNotificationStream.js";
import styles from "../../styles/NotificationBell.module.css";

const PAGE_SIZE = 20;

const notificationMessageKeys = {
    POST_LIKED: "notification.postLiked",
    POST_UNLIKED: "notification.postUnliked",
    POST_REPOSTED: "notification.postReposted",
    POST_UNREPOSTED: "notification.postUnreposted",
    POST_COMMENTED: "notification.postCommented",
    COMMENT_REPLIED: "notification.commentReplied",
    COMMENT_MENTIONED: "notification.commentMentioned",
    POPULAR_TOP_10: "notification.popularTop10",
    POPULAR_TOP_3: "notification.popularTop3",
    POPULAR_TOP_2: "notification.popularTop2",
    POPULAR_TOP_1: "notification.popularTop1",
};

// SSE와 목록 API에서 받은 같은 알림이 중복 표시되지 않게 한다.
function mergeNotifications(previous, received) {
    const notificationsById = new Map(
        [...received, ...previous].map((item) => [item.notificationId, item]),
    );

    return [...notificationsById.values()].sort(
        (left, right) => right.notificationId - left.notificationId,
    );
}

export default function NotificationBell({ onNotificationClick }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState("");

    const loadUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(Number(count) || 0);
        } catch {
            // 알림함을 열어 목록을 다시 조회할 수 있으므로 배지는 조용히 유지한다.
        }
    }, []);

    const loadFirstPage = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await getMyNotifications({
                size: PAGE_SIZE,
            });
            const received = Array.isArray(response) ? response : [];

            setNotifications(received);
            setHasMore(received.length === PAGE_SIZE);
        } catch (requestError) {
            setError(requestError?.message || t("notification.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore || notifications.length === 0) {
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const lastNotification = notifications.at(-1);
            const response = await getMyNotifications({
                cursorNotificationId: lastNotification.notificationId,
                size: PAGE_SIZE,
            });
            const received = Array.isArray(response) ? response : [];

            setNotifications((previous) => mergeNotifications(previous, received));
            setHasMore(received.length === PAGE_SIZE);
        } catch (requestError) {
            setError(requestError?.message || t("notification.loadError"));
        } finally {
            setIsLoading(false);
        }
    }, [hasMore, isLoading, notifications, t]);

    const observerTarget = useInfiniteScroll({
        enabled: isOpen && !isLoading && !error && hasMore && notifications.length > 0,
        onLoadMore: loadMore,
    });

    useEffect(() => {
        void loadUnreadCount();
    }, [loadUnreadCount]);

    useEffect(() => {
        if (isOpen) {
            void loadFirstPage();
        }
    }, [isOpen, loadFirstPage]);

    useNotificationStream({
        enabled: true,
        onNotification: (notification) => {
            setNotifications((previous) => mergeNotifications(previous, [notification]));

            if (!notification.readAt) {
                setUnreadCount((previous) => previous + 1);
            }
        },
    });

    async function handleNotificationClick(notification) {
        if (!notification.readAt) {
            try {
                await markNotificationAsRead(notification.notificationId);

                setNotifications((previous) =>
                    previous.map((item) =>
                        item.notificationId === notification.notificationId
                            ? { ...item, readAt: "read" }
                            : item,
                    ),
                );
                setUnreadCount((previous) => Math.max(0, previous - 1));
            } catch {
                return;
            }
        }

        setIsOpen(false);
        onNotificationClick?.(notification);
    }

    async function handleMarkAllAsRead() {
        try {
            await markAllNotificationsAsRead();

            setNotifications((previous) =>
                previous.map((item) => ({
                    ...item,
                    readAt: item.readAt ?? "read",
                })),
            );
            setUnreadCount(0);
        } catch (requestError) {
            setError(requestError?.message || t("notification.loadError"));
        }
    }

    function getNotificationMessage(notification) {
        const key = notificationMessageKeys[notification.notificationType];

        if (!key) {
            return "";
        }

        return t(key, {
            actor: notification.actorNickname || t("notification.unknownActor"),
        });
    }

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.bellButton}
                aria-label={t("notification.bellAria", {
                    count: unreadCount,
                })}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((previous) => !previous)}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                </svg>

                {unreadCount > 0 && (
                    <span className={styles.badge}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <section className={styles.panel} aria-label={t("notification.title")}>
                    <div className={styles.panelHeader}>
                        <h2>{t("notification.title")}</h2>

                        <button
                            type="button"
                            className={styles.markAllButton}
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                        >
                            {t("notification.markAllRead")}
                        </button>
                    </div>

                    {isLoading && notifications.length === 0 && (
                        <p className={styles.stateMessage}>{t("notification.loading")}</p>
                    )}

                    {!isLoading && error && (
                        <div className={styles.stateMessage} role="alert">
                            <p>{error}</p>
                            <button type="button" onClick={loadFirstPage}>
                                {t("notification.retry")}
                            </button>
                        </div>
                    )}

                    {!isLoading && !error && notifications.length === 0 && (
                        <p className={styles.stateMessage}>{t("notification.empty")}</p>
                    )}

                    {notifications.length > 0 && (
                        <ul className={styles.notificationList}>
                            {notifications.map((notification) => (
                                <li key={notification.notificationId}>
                                    <button
                                        type="button"
                                        className={styles.notificationItem}
                                        data-unread={!notification.readAt}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <span>{getNotificationMessage(notification)}</span>

                                        {!notification.readAt && (
                                            <span className={styles.unreadLabel}>
                                                {t("notification.unread")}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {isLoading && notifications.length > 0 && (
                        <p className={styles.stateMessage}>{t("notification.loading")}</p>
                    )}

                    <div ref={observerTarget} aria-hidden="true" />
                </section>
            )}
        </div>
    );
}