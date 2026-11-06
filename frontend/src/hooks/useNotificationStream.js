import { useEffect, useRef } from "react";
import { API_BASE } from "../api/client.js";
import { useAuthStore } from "../auth/store/useAuthStore.js";

const RECONNECT_DELAY_MS = 3000;

// SSE 한 묶음의 event/data/id 줄을 읽어 객체로 바꾼다.
function parseSseEvent(block) {
    const event = {
        eventName: "message",
        eventId: null,
        dataLines: [],
    };

    for (const line of block.split(/\r?\n/)) {
        if (line.startsWith("event:")) {
            event.eventName = line.slice("event:".length).trim();
        } else if (line.startsWith("id:")) {
            event.eventId = line.slice("id:".length).trim();
        } else if (line.startsWith("data:")) {
            event.dataLines.push(line.slice("data:".length).trimStart());
        }
    }

    return {
        eventName: event.eventName,
        eventId: event.eventId,
        data: event.dataLines.join("\n"),
    };
}

/*
 * Authorization 헤더가 필요한 SSE 연결을 fetch 스트림으로 관리한다.
 * EventSource는 임의 Authorization 헤더를 넣을 수 없어 사용하지 않는다.
 */
export function useNotificationStream({ enabled, onNotification, onConnectionError }) {
    const accessToken = useAuthStore((state) => state.accessToken);
    const notificationHandlerRef = useRef(onNotification);
    const errorHandlerRef = useRef(onConnectionError);

    // 부모 컴포넌트가 다시 렌더링되어도 기존 SSE 연결은 유지하고 최신 함수를 사용한다.
    useEffect(() => {
        notificationHandlerRef.current = onNotification;
        errorHandlerRef.current = onConnectionError;
    }, [onNotification, onConnectionError]);

    useEffect(() => {
        if (!enabled || !accessToken) {
            return undefined;
        }

        const abortController = new AbortController();
        let reconnectTimerId = null;
        let shouldReconnect = true;

        function scheduleReconnect() {
            if (!shouldReconnect || abortController.signal.aborted) {
                return;
            }

            reconnectTimerId = window.setTimeout(connect, RECONNECT_DELAY_MS);
        }

        function handleSseBlock(block) {
            const event = parseSseEvent(block);

            // 연결 직후의 connected 이벤트는 실제 알림 목록에 넣지 않는다.
            if (event.eventName !== "notification" || !event.data) {
                return;
            }

            try {
                notificationHandlerRef.current?.(JSON.parse(event.data));
            } catch {
                // 형식이 맞지 않는 이벤트 하나는 무시하고 SSE 연결은 유지한다.
            }
        }

        async function connect() {
            try {
                const response = await fetch(`${API_BASE}/notifications/stream`, {
                    headers: {
                        Accept: "text/event-stream",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    credentials: "same-origin",
                    signal: abortController.signal,
                });

                if (!response.ok || !response.body) {
                    const error = new Error("SSE 연결에 실패했습니다.");
                    error.status = response.status;
                    throw error;
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let remainingText = "";

                while (!abortController.signal.aborted) {
                    const { done, value } = await reader.read();

                    if (done) {
                        break;
                    }

                    remainingText += decoder.decode(value, {
                        stream: true,
                    });

                    const blocks = remainingText.split(/\r?\n\r?\n/);
                    remainingText = blocks.pop() ?? "";

                    blocks.forEach(handleSseBlock);
                }
            } catch (error) {
                if (!abortController.signal.aborted) {
                    errorHandlerRef.current?.(error);

                    // 서버가 회원당 연결 수 제한을 응답하면 반복 요청하지 않는다.
                    // 사용하지 않는 탭을 닫은 뒤 새로고침하면 다시 연결할 수 있다.
                    if (error.status === 429) {
                        shouldReconnect = false;
                    }
                }
            }

            scheduleReconnect();
        }

        void connect();

        return () => {
            shouldReconnect = false;
            abortController.abort();

            if (reconnectTimerId !== null) {
                window.clearTimeout(reconnectTimerId);
            }
        };
    }, [accessToken, enabled]);
}
