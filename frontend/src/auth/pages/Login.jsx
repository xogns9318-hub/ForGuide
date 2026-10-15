import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Banner from "../../components/Banner/Banner.jsx";
import ExampleBadge from "../../components/ExampleBadge/ExampleBadge.jsx";
import FieldError from "../../components/FieldError/FieldError.jsx";
import { login } from "../api/authApi.js";
import { ApiError } from "../api/apiError.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { getSafeNextPath } from "../utils/safeRedirect.js";
import "../auth.css";

// 입력 항목 순서 (오류가 있으면 이 순서대로 첫 항목에 포커스)
const fieldOrder = ["loginId", "password"];

// 로그인 화면 (Figma: 로그인 · 마이페이지로 이동, /login?next=/mypage)
export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // 로그인 후 이동할 곳: ?next= 값 중 안전한 내부 경로만, 없으면 홈
    const nextPath = getSafeNextPath(searchParams.get("next"));

    // 회원가입 직후 넘어왔다면 가입한 아이디를 미리 채운다
    const signedUpLoginId = location.state?.signedUpLoginId ?? "";

    const accessToken = useAuthStore((state) => state.accessToken);

    const [form, setForm] = useState({ loginId: signedUpLoginId, password: "" });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRefs = useRef({});
    const mounted = useRef(false);

    // 화면을 떠난 뒤 끝난 요청이 상태를 바꾸지 않도록 표시
    useEffect(() => {
        mounted.current = true;

        // 가입 직후라면 아이디가 채워져 있으니 비밀번호 칸부터 입력하게 한다
        if (signedUpLoginId) {
            inputRefs.current.password?.focus();
        }

        return () => {
            mounted.current = false;
        };
    }, [signedUpLoginId]);

    // 입력값 변경: 해당 항목의 이전 오류와 폼 전체 오류를 지운다
    function handleChange(event) {
        const { name, value } = event.target;

        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setFormError("");
    }

    // 로그인은 빈 값만 확인한다 (가입 규칙을 로그인 화면에서 드러내지 않기 위해)
    function validateForm() {
        return {
            loginId: form.loginId ? "" : "아이디를 입력해주세요.",
            password: form.password ? "" : "비밀번호를 입력해주세요.",
        };
    }

    function focusFirstError(nextErrors) {
        const first = fieldOrder.find((field) => nextErrors[field]);
        if (first) {
            inputRefs.current[first]?.focus();
        }
    }

    // 로그인 요청
    async function handleSubmit(event) {
        event.preventDefault();
        if (isSubmitting) return;

        const nextErrors = validateForm();
        setErrors(nextErrors);
        setFormError("");

        if (fieldOrder.some((field) => nextErrors[field])) {
            focusFirstError(nextErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            // 성공하면 authApi.login이 스토어에 로그인 상태를 저장한다
            await login(form);
            if (!mounted.current) return;

            // 다음 행동: 원래 가려던 화면(또는 홈)으로 이동. 뒤로 가기로 로그인 화면에 돌아오지 않게 replace
            navigate(nextPath, { replace: true });
        } catch (error) {
            if (!mounted.current) return;

            // 보안: 실패하면 입력한 비밀번호를 지운다
            setForm((prev) => ({ ...prev, password: "" }));

            if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...error.fieldErrors }));
                focusFirstError(error.fieldErrors);
                return;
            }

            // LOGIN_FAILED: 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않는 서버 메시지를 그대로 표시
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "로그인에 실패했습니다. 잠시 후 다시 시도해주세요.",
            );
            inputRefs.current.password?.focus();
        } finally {
            if (mounted.current) {
                setIsSubmitting(false);
            }
        }
    }

    // 입력 항목 공통 속성 (라벨 연결, 오류 안내 연결, 포커스 참조)
    function fieldProps(name) {
        return {
            id: `login-${name}`,
            name,
            value: form[name],
            onChange: handleChange,
            ref: (element) => {
                inputRefs.current[name] = element;
            },
            "aria-invalid": Boolean(errors[name]),
            "aria-describedby": errors[name] ? `login-${name}-error` : undefined,
            // 처리 중에는 수정만 막는다 (disabled면 오류 항목으로 포커스를 옮길 수 없다)
            readOnly: isSubmitting,
        };
    }

    // 이미 로그인한 상태로 들어오면 로그인 화면을 보여 주지 않고 바로 이동
    if (accessToken && !isSubmitting) {
        return <Navigate to={nextPath} replace />;
    }

    return (
        <div className="page-stack">
            {/* 공통 페이지 배너 */}
            <Banner
                title="로그인"
                description="도움을 찾고, 내일을 준비하는 첫걸음. ForGuide가 함께할게요."
            />

            {/* 공통 본문 박스 안의 입력 폼 */}
            <form
                className="panel"
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="login-title"
            >
                <div className="auth-panel-head panel-title">
                    <h2 id="login-title">다시 만나서 반가워요</h2>
                    <ExampleBadge />
                </div>

                {signedUpLoginId && (
                    <p className="auth-field-ok" role="status">
                        가입이 완료되었습니다. 비밀번호를 입력해 로그인해주세요.
                    </p>
                )}

                <div className="form-grid">
                    {/* 아이디 */}
                    <div className="form-field">
                        <label htmlFor="login-loginId">아이디</label>
                        <input
                            {...fieldProps("loginId")}
                            type="text"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={20}
                        />
                        <FieldError id="login-loginId-error" message={errors.loginId} />
                    </div>

                    {/* 비밀번호 + 보기 버튼 */}
                    <div className="form-field">
                        <label htmlFor="login-password">비밀번호</label>
                        <div className="auth-password">
                            <input
                                {...fieldProps("password")}
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                maxLength={32}
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                aria-pressed={showPassword}
                                aria-controls="login-password"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? "숨기기" : "보기"}
                            </button>
                        </div>
                        <FieldError id="login-password-error" message={errors.password} />
                    </div>
                </div>

                {formError && (
                    <p className="form-error" role="alert">
                        {formError}
                    </p>
                )}

                {/* 공통 버튼 배치 */}
                <div className="form-actions">
                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "로그인 중…" : "로그인"}
                    </button>
                    <Link to="/signup" className="button">
                        회원가입
                    </Link>
                </div>
            </form>
        </div>
    );
}
