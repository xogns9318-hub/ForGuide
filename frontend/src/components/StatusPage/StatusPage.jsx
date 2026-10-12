import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ExampleBadge from "../ExampleBadge/ExampleBadge.jsx";
import FieldError from "../FieldError/FieldError.jsx";
import { validateText } from "../../utils/validation.js";
import { maskName, maskAccount } from "../../utils/masking.js";
import "../../styles/statusPage.css";

// 상태별 안내 문구
const messages = {
    loading: "이동중입니다! 잠시만 기다려주세요~",
    empty: "조회된 결과가 없습니다!",
    failure: "정보를 불러오지 못했습니다! 다시 시도해주세요.",
    error: "잘못된 접근입니다! 다시 돌아가세요!!",
    input: "입력 내용을 확인해주세요.",
    example: "예시 표시와 개인정보 마스킹",
};

// 상태별 아이콘 표시
function StatusIcon({ type }) {
    return (
        <svg
            viewBox="0 0 64 64"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {type === "loading" ? (
                <>
                    <path d="M18 8h28 M18 56h28" />
                    <path d="M21 8v10c0 7 7 11 11 14-4 3-11 7-11 14v10" />
                    <path d="M43 8v10c0 7-7 11-11 14 4 3 11 7 11 14v10" />
                    <path
                        d="M26 18h12l-6 7z M25 49l7-8 7 8z"
                        fill="currentColor"
                        stroke="none"
                    />
                </>
            ) : type === "empty" ? (
                <>
                    <path d="M12 12h40v40H12z" />
                    <path d="M22 25h20 M22 34h20 M22 43h12" />
                </>
            ) : type === "input" || type === "example" ? (
                <>
                    <circle cx="32" cy="32" r="25" />
                    <path d="M32 28v16 M32 19v1" />
                </>
            ) : (
                <>
                    <circle cx="32" cy="32" r="25" />
                    <path d="M23 23l18 18 M41 23L23 41" />
                </>
            )}
        </svg>
    );
}

// 로딩·빈 결과·실패·입력 오류·예시 표시의 공통 화면
export default function StatusPage({
    type = "error",
    onRetry,
    onChangeConditions,
}) {
    // 재시도 요청의 중복 실행 방지
    const retryPending = useRef(false);
    const mounted = useRef(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryError, setRetryError] = useState("");

    // 입력 검증 초안에서 사용할 입력값과 안내
    const [inputValue, setInputValue] = useState("");
    const [inputError, setInputError] = useState("");
    const [inputSuccess, setInputSuccess] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
        };
    }, []);

    // 다른 상태 화면으로 이동하면 이전 안내 초기화
    useEffect(() => {
        setRetryError("");
        setInputValue("");
        setInputError("");
        setInputSuccess("");
    }, [type]);

    // 처리 중에는 공통 로딩 화면 표시
    const displayType = isRetrying ? "loading" : type;
    const isLoading = displayType === "loading";
    const isError =
        displayType === "error" || displayType === "failure";

    // 실제 조회 함수가 전달되면 같은 작업을 다시 실행
    async function handleRetry() {
        if (retryPending.current) {
            return;
        }

        // 독립 실패 페이지에서는 페이지 요청을 다시 실행
        if (!onRetry) {
            window.location.reload();
            return;
        }

        retryPending.current = true;
        setIsRetrying(true);
        setRetryError("");

        try {
            await onRetry();
        } catch {
            if (mounted.current) {
                setRetryError(
                    "다시 시도했지만 실패했습니다. 잠시 후 시도해주세요.",
                );
            }
        } finally {
            retryPending.current = false;

            if (mounted.current) {
                setIsRetrying(false);
            }
        }
    }

    // 필수 입력 검증을 확인하는 초안
    function handleValidate(event) {
        event.preventDefault();

        const message = validateText(inputValue, {
            required: true,
        });

        setInputError(message);
        setInputSuccess("");

        if (message) {
            inputRef.current?.focus();
            return;
        }

        // 검증 통과만 표시하며 실제 저장·조회는 하지 않기
        setInputSuccess("필수 입력 검증을 통과했습니다.");
    }

    return (
        <main className="status-page">
            <div className="status-page-content">
                {/* 공통 상태 아이콘 */}
                <div
                    className={`status-page-icon ${
                        isLoading ? "is-loading" : ""
                    } ${isError ? "is-error" : ""}`}
                >
                    <StatusIcon type={displayType} />
                </div>

                {/* 상태별 안내 문구 */}
                <h1
                    className="status-page-message"
                    role={isLoading ? "status" : undefined}
                    aria-live={isLoading ? "polite" : undefined}
                >
                    {messages[displayType] ?? messages.error}
                </h1>

                {/* 빈 결과에서는 조건 변경 안내 */}
                {displayType === "empty" && (
                    <>
                        <p className="text-muted">
                            입력한 조건을 변경하고 다시 조회해주세요.
                        </p>

                        {onChangeConditions ? (
                            <button
                                type="button"
                                className="button button-primary"
                                onClick={onChangeConditions}
                            >
                                조건 변경하기
                            </button>
                        ) : (
                            <Link to="/" className="button button-primary">
                                홈으로 돌아가기
                            </Link>
                        )}
                    </>
                )}

                {/* 실패 시 같은 조회 작업 재시도 */}
                {displayType === "failure" && (
                    <>
                        <p className="text-muted">
                            잠시 후 다시 시도해주세요.
                        </p>

                        {retryError && (
                            <p className="status-field-error" role="alert">
                                {retryError}
                            </p>
                        )}

                        <div className="status-page-actions">
                            <button
                                type="button"
                                className="button button-primary"
                                onClick={handleRetry}
                                disabled={isRetrying}
                            >
                                다시 시도
                            </button>

                            <Link to="/" className="button">
                                홈으로 돌아가기
                            </Link>
                        </div>
                    </>
                )}

                {/* 잘못된 주소 접근 시 홈 이동 */}
                {displayType === "error" && (
                    <Link to="/" className="button button-primary">
                        홈으로 돌아가기
                    </Link>
                )}

                {/* 입력 항목 아래의 검증 오류 표시 */}
                {displayType === "input" && (
                    <form
                        className="status-page-panel panel"
                        onSubmit={handleValidate}
                        noValidate
                    >
                        <p className="form-help">
                            필수 입력 검증을 확인하는 초안입니다.
                            실제 서비스 항목과 범위는 별도로 적용합니다.
                        </p>

                        <div className="form-field">
                            <label htmlFor="status-input">입력값</label>

                            <input
                                ref={inputRef}
                                id="status-input"
                                type="text"
                                value={inputValue}
                                required
                                aria-invalid={Boolean(inputError)}
                                aria-describedby={
                                    inputError
                                        ? "status-input-error"
                                        : undefined
                                }
                                onChange={(event) => {
                                    // 입력 수정 후 이전 검증 안내 초기화
                                    setInputValue(event.target.value);
                                    setInputError("");
                                    setInputSuccess("");
                                }}
                            />

                            <FieldError
                                id="status-input-error"
                                message={inputError}
                            />
                        </div>

                        <button
                            type="submit"
                            className="button button-primary"
                        >
                            입력 확인
                        </button>

                        <p role="status" aria-live="polite">
                            {inputSuccess}
                        </p>
                    </form>
                )}

                {/* 예시 배지와 가상 개인정보의 마스킹 표시 */}
                {displayType === "example" && (
                    <section
                        className="status-page-panel panel"
                        aria-label="예시 표시와 마스킹"
                    >
                        <div className="status-page-actions">
                            <ExampleBadge />
                            <ExampleBadge type="value" />
                        </div>

                        <p className="form-help">
                            아래는 실제 개인정보가 없는 표시 예시입니다.
                        </p>

                        <dl className="status-example-info">
                            <div>
                                <dt>가상 이름</dt>
                                <dd>{maskName("가상명")}</dd>
                            </div>
                            <div>
                                <dt>가상 계좌번호</dt>
                                <dd>{maskAccount("00000000000")}</dd>
                            </div>
                        </dl>
                    </section>
                )}
            </div>
        </main>
    );
}