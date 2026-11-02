import { client } from "./client.js";

// 알림 목록 조회에 필요한 커서 쿼리 문자열을 공통으로 만든다.
function buildNotificationCursorQuery({ cursorNotificationId = null, size = 20 } = {}) {
    const searchParams = new URLSearchParams({
        size: String(size),
    });

    if (cursorNotificationId) {
        searchParams.set("cursorNotificationId", String(cursorNotificationId));
    }

    return `?${searchParams.toString()}`;
}

// 헤더 알림함은 최신 알림부터 커서 방식으로 조회한다.
export function getMyNotifications(cursor) {
    return client.get(`/notifications${buildNotificationCursorQuery(cursor)}`);
}

// 벨 아이콘의 읽지 않은 알림 수 배지를 조회한다.
export function getUnreadNotificationCount() {
    return client.get("/notifications/unread-count");
}

// 알림을 클릭했을 때 해당 알림 한 건만 읽음 처리한다.
export function markNotificationAsRead(notificationId) {
    return client.patch(`/notifications/${notificationId}/read`);
}

// 헤더 알림함의 전체 읽음 버튼에 사용한다.
export function markAllNotificationsAsRead() {
    return client.patch("/notifications/read-all");
}
