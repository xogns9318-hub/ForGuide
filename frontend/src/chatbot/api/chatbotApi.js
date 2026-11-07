import { useAuthStore } from "../../auth/store/useAuthStore.js";
import { ApiError } from "../../api/apiError.js";
import { API_BASE, client, parseResponse, toNetworkError } from "../../api/client.js";
import { refreshAccessToken } from "../../api/tokenRefresh.js";

const CHATBOT_PATH = "/chatbot/messages";

// OpenAI 답변은 서버에서 최대 30초까지 기다리므로, 화면은 그보다 조금 더 기다린다
const ANSWER_TIMEOUT_MS = 40000;

// 이어서 받기: 이 시간 동안 새 글자가 한 번도 오지 않으면 끊긴 것으로 본다
const STREAM_IDLE_MS = 40000;

// 화면을 열 때: { available, dailyLimit, remainingToday, maxQuestionLength, messages: [{ role, content }] }
export function getChatbotMessages() {
    return client.get(CHATBOT_PATH);
}

// 질문 보내기: { question: { role, content }, answer: { role, content }, remainingToday }
// question.content는 서버가 개인정보를 가린 뒤의 내용이다
export function sendChatbotQuestion({ question, language }) {
    return client.post(CHATBOT_PATH, { question, language }, { timeoutMs: ANSWER_TIMEOUT_MS });
}

// 대화 지우기 (오늘 사용한 횟수는 그대로)
export function clearChatbotMessages() {
    return client.delete(CHATBOT_PATH);
}

// SSE 한 묶음의 event·data 줄을 읽는다. data는 서버가 JSON으로 보낸다
function parseEvent(block) {
    let name = "message";
    const dataLines = [];

    for (const line of block.split(/\r?\n/)) {
        if (line.startsWith("event:")) {
            name = line.slice("event:".length).trim();
        } else if (line.startsWith("data:")) {
            dataLines.push(line.slice("data:".length));
        }
    }

    if (dataLines.length === 0) {
        return { name, data: null };
    }

    try {
        return { name, data: JSON.parse(dataLines.join("\n")) };
    } catch {
        return { name, data: null };
    }
}

function openStream({ question, language, signal }) {
    const { accessToken } = useAuthStore.getState();

    return fetch(`${API_BASE}${CHATBOT_PATH}/stream`, {
        method: "POST",
        headers: {
            // 이어서 받기와, 연결 전에 나는 JSON 오류(로그인·글자 수·하루 횟수)를 둘 다 받는다
            Accept: "text/event-stream, application/json",
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ question, language }),
        credentials: "same-origin",
        signal,
    });
}

/*
 * 질문을 보내고 답변을 받는 대로 넘겨준다 (SSE).
 * onStart({ question, remainingToday }): 서버가 가린 질문과 남은 횟수
 * onDelta(text): 답변 글자 조각
 * 다 받으면 { question, answer, remainingToday }를 돌려준다.
 * 연결 전 오류는 서버 코드 그대로, 받던 중 끊기면 code가 CHATBOT_FAILED이거나 CHATBOT_INTERRUPTED인 ApiError를 던진다.
 * signal을 끊으면(화면을 떠날 때) 서버도 답변 생성을 멈추고 횟수를 되돌린다.
 */
export async function streamChatbotQuestion({ question, language, onStart, onDelta, signal }) {
    const controller = new AbortController();
    let idleTimer = null;
    let timedOut = false;

    const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            timedOut = true;
            controller.abort();
        }, STREAM_IDLE_MS);
    };
    const abortFromCaller = () => controller.abort();
    signal?.addEventListener("abort", abortFromCaller);

    let started = null;
    let answer = "";
    let completed = false;

    try {
        resetIdleTimer();
        let response = await openStream({ question, language, signal: controller.signal });

        // access token이 만료됐으면 한 번만 재발급하고 다시 연다 (아직 아무것도 받지 않았으므로 안전)
        if (response.status === 401) {
            const body = await response
                .clone()
                .json()
                .catch(() => null);
            if (body?.error?.code === "TOKEN_EXPIRED" && (await refreshAccessToken())) {
                response = await openStream({ question, language, signal: controller.signal });
            }
        }

        const type = response.headers.get("Content-Type") ?? "";
        if (!response.ok || !type.includes("text/event-stream") || !response.body) {
            // 연결 전 오류는 공통 응답 { success: false, error } 형식이다
            await parseResponse(response);
            throw new ApiError("CHATBOT_FAILED", "챗봇 답변을 받지 못했습니다.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            resetIdleTimer();
            buffer += decoder.decode(value, { stream: true });

            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop() ?? "";

            for (const block of blocks) {
                const event = parseEvent(block);

                if (event.name === "start" && event.data) {
                    started = event.data;
                    onStart?.(started);
                } else if (event.name === "delta" && typeof event.data?.text === "string") {
                    answer += event.data.text;
                    onDelta?.(event.data.text);
                } else if (event.name === "done") {
                    completed = true;
                    return {
                        question: started?.question,
                        answer: { role: "ASSISTANT", content: answer },
                        remainingToday: event.data?.remainingToday ?? started?.remainingToday,
                    };
                } else if (event.name === "error") {
                    throw new ApiError(
                        event.data?.code ?? "CHATBOT_FAILED",
                        event.data?.message ?? "챗봇 답변을 받지 못했습니다.",
                    );
                }
            }
        }

        // done이나 error 없이 연결이 닫혔다
        throw new ApiError("CHATBOT_INTERRUPTED", "답변이 중간에 끊겼습니다.");
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        if (timedOut) {
            throw new ApiError("TIMEOUT", "응답이 늦어지고 있습니다. 잠시 후 다시 시도해주세요.");
        }
        if (signal?.aborted) {
            throw new ApiError("ABORTED", "질문을 멈췄습니다.");
        }
        throw started
            ? new ApiError("CHATBOT_INTERRUPTED", "답변이 중간에 끊겼습니다.")
            : toNetworkError(error);
    } finally {
        clearTimeout(idleTimer);
        signal?.removeEventListener("abort", abortFromCaller);
        // 다 받았으면 서버가 연결을 닫으므로 그대로 두고, 그 밖에는 연결을 끊어 서버도 멈추게 한다
        if (!completed) {
            controller.abort();
        }
    }
}
