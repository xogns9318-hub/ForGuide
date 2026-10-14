import { useEffect, useRef, useState } from "react";
import "../../styles/selectBox.css";

// 펼침 상태와 키보드 선택을 직접 관리하는 공통 선택창
export default function SelectBox({
    id,
    labelledBy,
    value,
    options,
    onChange,
    compact = false,
}) {
    const rootRef = useRef(null);
    const triggerRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const selectedIndex = Math.max(
        0,
        options.findIndex((option) => option.value === value),
    );

    const selectedOption = options[selectedIndex];

    // 선택창 밖을 누르면 목록 닫기
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleOutsidePointer(event) {
            if (!rootRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("pointerdown", handleOutsidePointer);

        return () => {
            document.removeEventListener(
                "pointerdown",
                handleOutsidePointer,
            );
        };
    }, [isOpen]);

    // 선택한 값을 전달하고 목록 닫기
    function chooseOption(index, pointer = false) {
        onChange(options[index].value);
        setIsOpen(false);

        // 마우스 선택 후에는 강조 해제
        if (pointer) {
            triggerRef.current?.blur();
        }
    }

    // 키보드로 목록을 열고 항목 선택
    function handleKeyDown(event) {
        const { key } = event;

        if (key === "Tab") {
            setIsOpen(false);
            return;
        }

        if (key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
            return;
        }

        if (key === "ArrowDown" || key === "ArrowUp") {
            event.preventDefault();

            if (!isOpen) {
                setActiveIndex(selectedIndex);
                setIsOpen(true);
                return;
            }

            const direction = key === "ArrowDown" ? 1 : -1;

            setActiveIndex((index) =>
                Math.max(
                    0,
                    Math.min(options.length - 1, index + direction),
                ),
            );
            return;
        }

        if (isOpen && (key === "Home" || key === "End")) {
            event.preventDefault();
            setActiveIndex(key === "Home" ? 0 : options.length - 1);
            return;
        }

        if (key === "Enter" || key === " ") {
            event.preventDefault();

            if (isOpen) {
                chooseOption(activeIndex);
            } else {
                setActiveIndex(selectedIndex);
                setIsOpen(true);
            }
        }
    }

    return (
        <div
            ref={rootRef}
            className={`select-box ${compact ? "is-compact" : ""} ${
                isOpen ? "is-open" : ""
            }`}
            onBlur={(event) => {
                // 키보드로 선택창 밖으로 이동하면 닫기
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsOpen(false);
                }
            }}
        >
            <button
                ref={triggerRef}
                id={id}
                type="button"
                role="combobox"
                className="select-box-trigger"
                aria-labelledby={labelledBy}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={`${id}-options`}
                aria-activedescendant={
                    isOpen ? `${id}-option-${activeIndex}` : undefined
                }
                onKeyDown={handleKeyDown}
                onClick={(event) => {
                    if (isOpen) {
                        setIsOpen(false);

                        // 같은 선택창을 다시 클릭하면 강조도 해제
                        if (event.detail > 0) {
                            event.currentTarget.blur();
                        }
                    } else {
                        setActiveIndex(selectedIndex);
                        setIsOpen(true);
                    }
                }}
            >
                <span>{selectedOption.label}</span>

                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                >
                    <path d="M5 7l5 5 5-5" />
                </svg>
            </button>

            {isOpen && (
                <div
                    id={`${id}-options`}
                    className="select-box-options"
                    role="listbox"
                    aria-labelledby={labelledBy}
                >
                    {options.map((option, index) => (
                        <div
                            key={option.value}
                            id={`${id}-option-${index}`}
                            role="option"
                            aria-selected={option.value === value}
                            className={`select-box-option ${
                                index === activeIndex ? "is-active" : ""
                            }`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseDown={(event) => {
                                // 목록을 클릭하는 동안 선택창 포커스 유지
                                event.preventDefault();
                            }}
                            onClick={() => chooseOption(index, true)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}