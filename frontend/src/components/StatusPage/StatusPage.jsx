// 화면 상태와 생명주기를 관리하는 React 기능 사용
import { useEffect, useRef, useState } from "react";
// 주소 이동과 현재 경로를 확인하는 라우터 기능 사용
import { Link } from "react-router-dom";
import ExampleBadge from "../ExampleBadge/ExampleBadge.jsx";
import FieldError from "../FieldError/FieldError.jsx";
import { validateText } from "../../utils/validation.js";
import { maskName, maskAccount } from "../../utils/masking.js";
// 이 화면에서 사용할 스타일 연결
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
    // 화면이 사라진 뒤 상태를 변경하지 않도록 확인
    const mounted = useRef(false);
    // 재시도 중에는 공통 로딩 상태 표시
    const [isRetrying, setIsRetrying] = useState(false);
    // 재시도 실패 안내 문구 관리
    const [retryError, setRetryError] = useState("");

    // 입력 검증 초안에서 사용할 입력값과 안내
    const [inputValue, setInputValue] = useState("");
    // 필수 입력 검증 오류 관리
    const [inputError, setInputError] = useState("");
    // 저장 대신 검증 통과 안내만 표시
    const [inputSuccess, setInputSuccess] = useState("");
    // 검증 실패 시 입력창으로 포커스를 이동할 참조
    const inputRef = useRef(null);

    useEffect(() => {
        mounted.current = true;

        return () => {
            mounted.current = false;
        };
    }, []);

    // 다른 상태 화면으로 이동하면 이전 안내 초기화
    useEffect(() => {
        // 이전 재시도 실패 안내 초기화
        setRetryError("");
        setInputValue("");
        // 입력 수정 또는 재검증 시 이전 오류 안내 초기화
        setInputError("");
        // 이전 검증 통과 안내 초기화
        setInputSuccess("");
    }, [type]);

    // 처리 중에는 공통 로딩 화면 표시
    const displayType = isRetrying ? "loading" : type;
    // 로딩 안내와 아이콘 스타일 적용 여부 확인
    const isLoading = displayType === "loading";
    // 실패 또는 잘못된 접근의 아이콘 스타일 적용 여부 확인
    const isError =
        displayType === "error" || displayType === "failure";

    // 실제 조회 함수가 전달되면 같은 작업을 다시 실행
    async function handleRetry() {
        // 현재 재시도가 실행 중이면 중복 처리하지 않음
        if (retryPending.current) {
            return;
        }

        // 독립 실패 페이지에서는 페이지 요청을 다시 실행
        if (!onRetry) {
            window.location.reload();
            return;
        }

        // React 상태 갱신 전에도 중복 재시도 차단
        retryPending.current = true;
        // 재시도 실행 중에는 로딩 상태 표시
        setIsRetrying(true);
        // 이전 재시도 실패 안내 초기화
        setRetryError("");

        try {
            await onRetry();
        } catch {
            // 화면이 남아 있는 경우에만 비동기 결과 반영
            if (mounted.current) {
                setRetryError(
                    "다시 시도했지만 실패했습니다. 잠시 후 시도해주세요.",
                );
            }
        } finally {
            // 요청 종료 후 다음 재시도 허용
            retryPending.current = false;

            // 화면이 남아 있는 경우에만 비동기 결과 반영
            if (mounted.current) {
                // 재시도 처리가 끝나면 원래 상태 표시
                setIsRetrying(false);
            }
        }
    }

    // 필수 입력 검증을 확인하는 초안
    function handleValidate(event) {
        // 페이지 새로고침이나 브라우저 기본 키 동작 방지
        event.preventDefault();

        // 검증 함수가 반환한 오류 문구 확인
        const message = validateText(inputValue, {
            required: true,
        });

        setInputError(message);
        // 이전 검증 통과 안내 초기화
        setInputSuccess("");

        // 검증 오류가 있으면 다음 처리를 진행하지 않음
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
                            {/* 버튼 클릭으로 연결된 선택 또는 처리 동작 실행 */}
                            <button
                                type="button"
                                className="button button-primary"
                                onClick={handleRetry}
                                disabled={isRetrying}
                            >
                                다시 시도
                            </button>

                            {/* 연결된 안내 또는 서비스 페이지로 이동 */}
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
                        {/* 입력 또는 결과 해석에 필요한 보조 설명 */}
                        <p className="form-help">
                            필수 입력 검증을 확인하는 초안입니다.
                            실제 서비스 항목과 범위는 별도로 적용합니다.
                        </p>

                        <div className="form-field">
                            {/* 입력 식별자와 제목을 연결 */}
                            <label htmlFor="status-input">입력값</label>

                            {/* 문자열 입력 상태와 변경·포커스 종료 동작 연결 */}
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
                                    // 입력 수정 또는 재검증 시 이전 오류 안내 초기화
                                    setInputError("");
                                    // 이전 검증 통과 안내 초기화
                                    setInputSuccess("");
                                }}
                            />

                            {/* 오류가 있을 때만 입력 아래에 경고 표시 */}
                            <FieldError
                                id="status-input-error"
                                message={inputError}
                            />
                        </div>

                        {/* 버튼 클릭으로 연결된 선택 또는 처리 동작 실행 */}
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
                            {/* 실제 결과와 구분할 예시 표시 배지 */}
                            <ExampleBadge />
                            {/* 실제 결과와 구분할 예시 표시 배지 */}
                            <ExampleBadge type="value" />
                        </div>

                        {/* 입력 또는 결과 해석에 필요한 보조 설명 */}
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