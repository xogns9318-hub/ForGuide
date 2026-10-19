import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useModalStore } from "./modal.js";
import styles from "./Modal.module.css";

// Tab으로 이동할 수 있는 요소 (포커스를 창 안에 가두는 데 쓴다)
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

// 확인창·알림 한 개. 버튼 문구를 따로 주지 않으면 t("modal.confirm")·t("modal.cancel")
export function Modal({ type, title, message, confirmText, cancelText, onClose }) {
    const { t } = useTranslation();
    const dialogRef = useRef(null);
    const confirmRef = useRef(null);
    const titleId = useId();
    const messageId = useId();

    // 열리면 포커스를 창 안(확인 버튼)으로 옮긴다
    useEffect(() => {
        confirmRef.current?.focus();
    }, []);

    function handleKeyDown(event) {
        // Esc: 취소로 닫는다
        if (event.key === "Escape") {
            event.stopPropagation();
            onClose(false);
            return;
        }

        // Tab: 마지막 요소에서 처음으로, 처음 요소에서 마지막으로 돌려 창 밖으로 나가지 않게 한다
        if (event.key !== "Tab") return;
        const items = dialogRef.current.querySelectorAll(FOCUSABLE);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    // 바깥(어두운 배경)을 누르면 취소로 닫는다. 창 안을 누른 것은 무시한다
    function handleBackdropClick(event) {
        if (event.target === event.currentTarget) {
            onClose(false);
        }
    }

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick} onKeyDown={handleKeyDown}>
            <div
                ref={dialogRef}
                className={styles.dialog}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
                aria-describedby={messageId}
            >
                {title && (
                    <h2 id={titleId} className={styles.title}>
                        {title}
                    </h2>
                )}
                <p id={messageId} className={styles.message}>
                    {message}
                </p>
                <div className={styles.actions}>
                    {type === "confirm" && (
                        <button type="button" className="button" onClick={() => onClose(false)}>
                            {cancelText ?? t("modal.cancel")}
                        </button>
                    )}
                    <button
                        ref={confirmRef}
                        type="button"
                        className="button button-primary"
                        onClick={() => onClose(true)}
                    >
                        {confirmText ?? t("modal.confirm")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// 앱에 한 번만 두는 자리 (App.jsx). 열린 창이 있을 때만 body 아래에 그린다
// key: 창이 바뀌면 새로 그려서 포커스가 새 창으로 가게 한다
export default function ModalHost() {
    const current = useModalStore((state) => state.current);
    const close = useModalStore((state) => state.close);

    if (!current) return null;

    return createPortal(
        <Modal
            key={current.id}
            type={current.type}
            title={current.title}
            message={current.message}
            confirmText={current.confirmText}
            cancelText={current.cancelText}
            onClose={close}
        />,
        document.body,
    );
}
