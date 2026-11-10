import { useId, useRef, useState } from "react";
import styles from "./Header.module.css";

export default function AccountMenu({ label, inline, children }) {
    const [open, setOpen] = useState(false);
    const panelId = useId();
    const triggerRef = useRef(null);

    // 모바일에서는 기존 회원 메뉴 배치를 유지한다.
    if (inline) {
        return <>{children}</>;
    }

    return (
        <div
            className={styles.accountMenu}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={(event) => {
                // 외부에서 키보드로 진입했을 때도 목록을 표시한다.
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOpen(true);
                }
            }}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOpen(false);
                }
            }}
            onKeyDown={(event) => {
                if (event.key !== "Escape") return;

                event.preventDefault();
                event.stopPropagation();
                triggerRef.current?.focus();
                setOpen(false);
            }}
        >
            <button
                ref={triggerRef}
                type="button"
                className={styles.accountTrigger}
                aria-expanded={open}
                aria-controls={open ? panelId : undefined}
                onPointerDown={(event) => {
                    if (event.pointerType === "mouse") event.preventDefault();
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
            >
                {label}
            </button>

            {open && (
                <div
                    id={panelId}
                    className={styles.accountOptions}
                    onClick={(event) => {
                        // 기존 링크·로그아웃 처리를 실행하면서 목록을 닫는다.
                        if (event.target.closest("a, button")) {
                            setOpen(false);
                        }
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}