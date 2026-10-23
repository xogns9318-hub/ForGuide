// 화면 상태와 생명주기를 관리하는 React 기능 사용
import { useEffect, useRef, useState } from "react";
// 이 화면에서 사용할 스타일 연결
import "../../styles/selectBox.css";

// 펼침 상태와 키보드 선택을 직접 관리하는 공통 선택창
export default function SelectBox({
    // 카테고리를 구분할 이름
    id,
    labelledBy,
    // 선택 항목이나 상환 방식을 구분할 값
    value,
    options,
    onChange,
    compact = false,
    // 언어 선택에만 마우스 올림으로 여는 동작을 사용한다.
    openOnHover = false,
}) {
    // 선택창 바깥 클릭을 판별할 전체 영역 참조
    const rootRef = useRef(null);
    // 선택 후 강조를 해제할 버튼 참조
    const triggerRef = useRef(null);
    // 마우스 올림과 모바일 터치를 구분한다.
    const hoverRef = useRef(false);
    // 공통 선택창의 목록 열림 상태 관리
    const [isOpen, setIsOpen] = useState(false);
    // 방향키와 마우스로 가리킨 항목 위치 관리
    const [activeIndex, setActiveIndex] = useState(0);

    // 현재 값에 해당하는 항목을 찾고 없으면 첫 항목 사용
    const selectedIndex = Math.max(
        0,
        options.findIndex((option) => option.value === value),
    );

    // 선택창 버튼에 표시할 항목 정보
    const selectedOption = options[selectedIndex];

    // 선택창 밖을 누르면 목록 닫기
    useEffect(() => {
        // 닫힌 선택창에서는 바깥 클릭 감시를 하지 않음
        if (!isOpen) {
            return;
        }

        // 선택창 바깥을 누르면 열린 목록 닫기
        function handleOutsidePointer(event) {
            if (!rootRef.current?.contains(event.target)) {
                // 선택창의 펼친 목록 닫기
                setIsOpen(false);
            }
        }

        // 열린 선택창 바깥의 마우스 입력 감시
        document.addEventListener("pointerdown", handleOutsidePointer);

        return () => {
            // 닫히거나 화면을 벗어나면 입력 감시 제거
            document.removeEventListener("pointerdown", handleOutsidePointer);
        };
    }, [isOpen]);

    // 선택한 값을 전달하고 목록 닫기
    function chooseOption(index, pointer = false) {
        onChange(options[index].value);
        // 선택창의 펼친 목록 닫기
        setIsOpen(false);

        // 마우스 선택 후에는 강조 해제
        if (pointer) {
            triggerRef.current?.blur();
        }
    }

    // 키보드로 목록을 열고 항목 선택
    function handleKeyDown(event) {
        const { key } = event;

        // 다음 입력 요소로 이동하면서 목록 닫기
        if (key === "Tab") {
            // 선택창의 펼친 목록 닫기
            setIsOpen(false);
            return;
        }

        // 목록을 닫고 기본 Escape 처리 방지
        if (key === "Escape") {
            // 페이지 새로고침이나 브라우저 기본 키 동작 방지
            event.preventDefault();
            // 선택창의 펼친 목록 닫기
            setIsOpen(false);
            return;
        }

        // 방향키로 목록을 열거나 가리킨 항목 변경
        if (key === "ArrowDown" || key === "ArrowUp") {
            // 페이지 새로고침이나 브라우저 기본 키 동작 방지
            event.preventDefault();

            // 닫힌 선택창에서는 바깥 클릭 감시를 하지 않음
            if (!isOpen) {
                // 목록을 열 때 현재 선택 항목부터 이동 시작
                setActiveIndex(selectedIndex);
                // 선택창의 목록 표시
                setIsOpen(true);
                return;
            }

            // 누른 방향키에 따라 이동할 항목 위치 결정
            const direction = key === "ArrowDown" ? 1 : -1;

            setActiveIndex((index) => Math.max(0, Math.min(options.length - 1, index + direction)));
            return;
        }

        // 열린 목록의 첫 항목 또는 마지막 항목으로 이동
        if (isOpen && (key === "Home" || key === "End")) {
            // 페이지 새로고침이나 브라우저 기본 키 동작 방지
            event.preventDefault();
            setActiveIndex(key === "Home" ? 0 : options.length - 1);
            return;
        }

        // Enter 또는 공백 키로 목록 열기나 선택 확정
        if (key === "Enter" || key === " ") {
            // 페이지 새로고침이나 브라우저 기본 키 동작 방지
            event.preventDefault();

            // 목록이 이미 열려 있는지 확인
            if (isOpen) {
                chooseOption(activeIndex);
            } else {
                // 목록을 열 때 현재 선택 항목부터 이동 시작
                setActiveIndex(selectedIndex);
                // 선택창의 목록 표시
                setIsOpen(true);
            }
        }
    }

    return (
        <div
            ref={rootRef}
            className={`select-box ${compact ? "is-compact" : ""} ${isOpen ? "is-open" : ""}`}
            onPointerEnter={(event) => {
                // 언어 선택창에서 실제 마우스를 올렸을 때만 목록을 연다.
                if (!openOnHover || event.pointerType !== "mouse") return;

                hoverRef.current = true;
                setActiveIndex(selectedIndex);
                setIsOpen(true);
            }}
            onPointerLeave={(event) => {
                // 버튼과 목록을 모두 벗어나면 닫는다.
                if (!openOnHover || event.pointerType !== "mouse") return;

                hoverRef.current = false;
                setIsOpen(false);
            }}
            onBlur={(event) => {
                // 키보드로 선택창 밖으로 이동하면 닫기
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    // 선택창의 펼친 목록 닫기
                    setIsOpen(false);
                }
            }}
        >
            {/* 버튼 클릭으로 연결된 선택 또는 처리 동작 실행 */}
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
                aria-activedescendant={isOpen ? `${id}-option-${activeIndex}` : undefined}
                onKeyDown={handleKeyDown}
                onClick={(event) => {
                    // 마우스로 연 언어 목록은 버튼 클릭으로 다시 닫지 않는다.
                    if (openOnHover && hoverRef.current) return;
                    // 목록이 이미 열려 있는지 확인
                    if (isOpen) {
                        // 선택창의 펼친 목록 닫기
                        setIsOpen(false);

                        // 같은 선택창을 다시 클릭하면 강조도 해제
                        if (event.detail > 0) {
                            event.currentTarget.blur();
                        }
                    } else {
                        // 목록을 열 때 현재 선택 항목부터 이동 시작
                        setActiveIndex(selectedIndex);
                        // 선택창의 목록 표시
                        setIsOpen(true);
                    }
                }}
            >
                <span>{selectedOption.label}</span>

                {/* 이미지 파일 대신 SVG 선으로 아이콘 표시 */}
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
                            className={`select-box-option ${index === activeIndex ? "is-active" : ""
                                }`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseDown={(event) => {
                                // 목록을 클릭하는 동안 선택창 포커스 유지
                                event.preventDefault();
                            }}
                            onClick={() => chooseOption(index, true)}
                        >
                            <span>{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
