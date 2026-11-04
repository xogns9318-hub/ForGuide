import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
    clearChatbotMessages,
    getChatbotMessages,
    sendChatbotQuestion,
} from "../../api/chatbotApi.js";
import ChatbotMessageText from "../components/ChatbotMessageText.jsx";
import styles from "./ChatbotPage.module.css";

const INQUIRY_PATH = "/contact/inquiry";

// 서버 오류 코드 → 화면 문구 키 (목록에 없으면 공통 실패 문구)
const ERROR_KEYS = {
    CHATBOT_DAILY_LIMIT: "chatbot.error.dailyLimit",
    CHATBOT_QUESTION_TOO_LONG: "chatbot.error.tooLong",
    CHATBOT_UNAVAILABLE: "chatbot.error.unavailable",
    TIMEOUT: "chatbot.error.timeout",
    NETWORK_ERROR: "chatbot.error.network",
};

// 이모지도 한 글자로 센다 (서버와 같은 기준)
function countCharacters(text) {
    return Array.from(text).length;
}

export default function ChatbotPage() {
    const { t, i18n } = useTranslation();

    // 서버에서 받은 상태: 사용 가능 여부·한도·최근 대화
    const [status, setStatus] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [question, setQuestion] = useState("");
    // 답을 기다리는 동안 화면에만 먼저 보여 주는 질문 (서버 응답이 오면 가린 질문으로 바뀐다)
    const [pendingQuestion, setPendingQuestion] = useState("");
    const [sendError, setSendError] = useState("");
    const [isClearing, setIsClearing] = useState(false);

    const messageListRef = useRef(null);

    const loadMessages = useCallback(async () => {
        setIsLoading(true);
        setLoadError(false);

        try {
            const data = await getChatbotMessages();
            setStatus(data);
            setMessages(Array.isArray(data?.messages) ? data.messages : []);
        } catch {
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    // 새 메시지·답변 대기 표시가 생기면 대화창 안쪽만 맨 아래로 내린다 (페이지 전체는 움직이지 않음)
    useEffect(() => {
        const list = messageListRef.current;
        if (list) {
            list.scrollTop = list.scrollHeight;
        }
    }, [messages, pendingQuestion]);

    const isSending = pendingQuestion !== "";
    const maxLength = status?.maxQuestionLength ?? 500;
    const length = countCharacters(question);
    const isTooLong = length > maxLength;
    const isLimitReached = status != null && status.remainingToday <= 0;
    const canAsk = status?.available && !isLimitReached && !isSending;

    async function handleSubmit(event) {
        event.preventDefault();

        const trimmed = question.trim();
        if (!canAsk || trimmed === "" || isTooLong) {
            return;
        }

        setSendError("");
        setPendingQuestion(trimmed);
        setQuestion("");

        try {
            const reply = await sendChatbotQuestion({
                question: trimmed,
                language: i18n.resolvedLanguage || i18n.language,
            });

            // 서버가 가린 질문과 답변을 대화 끝에 붙이고 남은 횟수를 갱신한다
            setMessages((previous) => [...previous, reply.question, reply.answer]);
            setStatus((previous) => ({ ...previous, remainingToday: reply.remainingToday }));
        } catch (error) {
            // 보내지 못한 질문은 입력칸에 되돌려 다시 보낼 수 있게 한다
            setQuestion(trimmed);
            setSendError(t(ERROR_KEYS[error?.code] ?? "chatbot.error.failed", { max: maxLength }));

            if (error?.code === "CHATBOT_DAILY_LIMIT") {
                setStatus((previous) => ({ ...previous, remainingToday: 0 }));
            }
            if (error?.code === "CHATBOT_UNAVAILABLE") {
                setStatus((previous) => ({ ...previous, available: false }));
            }
        } finally {
            setPendingQuestion("");
        }
    }

    // Enter는 보내기, Shift+Enter는 줄바꿈 (한글 조합 중 Enter는 무시)
    function handleKeyDown(event) {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            handleSubmit(event);
        }
    }

    async function handleClear() {
        if (messages.length === 0 || !window.confirm(t("chatbot.clearConfirm"))) {
            return;
        }

        setIsClearing(true);
        setSendError("");

        try {
            await clearChatbotMessages();
            setMessages([]);
        } catch {
            setSendError(t("chatbot.error.clearFailed"));
        } finally {
            setIsClearing(false);
        }
    }

    return (
        <section className={styles.page} aria-labelledby="chatbot-page-title">
            <header className={styles.heading}>
                <h1 id="chatbot-page-title">{t("chatbot.title")}</h1>
                <p>{t("chatbot.description")}</p>
            </header>

            <div className={`panel ${styles.chat}`}>
                {isLoading && (
                    <p className={styles.state} role="status">
                        {t("chatbot.loading")}
                    </p>
                )}

                {!isLoading && loadError && (
                    <div className={styles.state} role="alert">
                        <p>{t("chatbot.loadError")}</p>
                        <button type="button" className="button" onClick={loadMessages}>
                            {t("chatbot.retry")}
                        </button>
                    </div>
                )}

                {!isLoading && !loadError && status && (
                    <>
                        <div className={styles.toolbar}>
                            <span className={styles.remaining}>
                                {t("chatbot.remaining", {
                                    count: status.remainingToday,
                                    limit: status.dailyLimit,
                                })}
                            </span>
                            <button
                                type="button"
                                className="button"
                                onClick={handleClear}
                                disabled={messages.length === 0 || isClearing || isSending}
                            >
                                {t("chatbot.clear")}
                            </button>
                        </div>

                        {!status.available && (
                            <p className={styles.notice} role="status">
                                {t("chatbot.unavailable")}
                            </p>
                        )}

                        <ol ref={messageListRef} className={styles.messages} aria-live="polite">
                            {messages.length === 0 && !isSending && (
                                <li className={styles.empty}>{t("chatbot.empty")}</li>
                            )}

                            {messages.map((message, index) => (
                                <li
                                    key={index}
                                    className={
                                        message.role === "USER" ? styles.user : styles.assistant
                                    }
                                >
                                    <span className={styles.speaker}>
                                        {message.role === "USER"
                                            ? t("chatbot.speaker.user")
                                            : t("chatbot.speaker.assistant")}
                                    </span>
                                    <p>
                                        <ChatbotMessageText
                                            text={message.content}
                                            linkPaths={message.role !== "USER"}
                                        />
                                    </p>
                                </li>
                            ))}

                            {isSending && (
                                <>
                                    <li className={styles.user}>
                                        <span className={styles.speaker}>
                                            {t("chatbot.speaker.user")}
                                        </span>
                                        <p>{pendingQuestion}</p>
                                    </li>
                                    <li className={styles.assistant} role="status">
                                        <span className={styles.speaker}>
                                            {t("chatbot.speaker.assistant")}
                                        </span>
                                        <p className="text-muted">{t("chatbot.answering")}</p>
                                    </li>
                                </>
                            )}
                        </ol>

                        {isLimitReached && status.available && (
                            <p className={styles.notice} role="status">
                                {t("chatbot.error.dailyLimit")}
                            </p>
                        )}

                        {sendError && (
                            <p className="form-error" role="alert">
                                {sendError}
                            </p>
                        )}

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <label className="form-field">
                                <span className={styles.srOnly}>{t("chatbot.inputLabel")}</span>
                                <textarea
                                    value={question}
                                    onChange={(event) => setQuestion(event.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t("chatbot.placeholder")}
                                    rows={3}
                                    disabled={!canAsk}
                                    aria-invalid={isTooLong}
                                />
                            </label>
                            <div className={styles.formFooter}>
                                <span
                                    className={isTooLong ? styles.countOver : styles.count}
                                    aria-live="polite"
                                >
                                    {t("chatbot.count", { count: length, max: maxLength })}
                                </span>
                                <button
                                    type="submit"
                                    className="button button-primary"
                                    disabled={!canAsk || question.trim() === "" || isTooLong}
                                >
                                    {isSending ? t("chatbot.sending") : t("chatbot.send")}
                                </button>
                            </div>
                            <p className="form-help">{t("chatbot.privacyNotice")}</p>
                        </form>
                    </>
                )}
            </div>

            <aside className={`panel ${styles.handoff}`}>
                <div>
                    <h2>{t("chatbot.handoff.title")}</h2>
                    <p>{t("chatbot.handoff.description")}</p>
                </div>
                <Link to={INQUIRY_PATH} className="button button-primary">
                    {t("chatbot.handoff.link")}
                </Link>
            </aside>
        </section>
    );
}
