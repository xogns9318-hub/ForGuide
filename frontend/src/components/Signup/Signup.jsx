import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Banner from "../Banner/Banner.jsx";
import ExampleBadge from "../ExampleBadge/ExampleBadge.jsx";
import FieldError from "../FieldError/FieldError.jsx";
import { checkLoginId, signup } from "../../api/authApi.js";
import { ApiError } from "../../api/apiError.js";
import {
    validateLoginId,
    validatePassword,
    validateName,
    validateEmail,
} from "../../utils/validation.js";
import "../../styles/auth.css";

// 입력 항목 순서 (오류가 있으면 이 순서대로 첫 항목에 포커스)
const fieldOrder = ["loginId", "password", "name", "email"];

const emptyForm = { loginId: "", password: "", name: "", email: "" };

// 항목별 검사 규칙
const validators = {
    loginId: validateLoginId,
    password: validatePassword,
    name: validateName,
    email: validateEmail,
};

// 회원가입 화면 (Figma: 회원가입 · 입력, /signup)
export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 아이디 중복 확인 결과
    // status: idle(확인 전) / checking / available / taken
    // checkedId: 확인한 아이디. 입력값이 바뀌면 결과는 무효가 된다
    const [idCheck, setIdCheck] = useState({ status: "idle", checkedId: "" });

    const inputRefs = useRef({});
    const mounted = useRef(false);

    // 지금 입력칸에 있는 아이디 (중복 확인 응답이 늦게 와도 현재 값과 비교하기 위해)
    const latestLoginId = useRef("");

    // 화면을 떠난 뒤 끝난 요청이 상태를 바꾸지 않도록 표시
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // 입력값 변경: 해당 항목의 이전 오류와 폼 전체 오류를 지운다
    function handleChange(event) {
        const { name, value } = event.target;

        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setFormError("");

        // 아이디를 바꾸면 이전 중복 확인 결과는 무효
        if (name === "loginId") {
            latestLoginId.current = value;
            setIdCheck({ status: "idle", checkedId: "" });
        }
    }

    // 아이디 입력칸을 벗어나면 형식 확인 후 자동으로 중복 확인 (Figma에 별도 버튼 없음)
    async function handleLoginIdBlur() {
        const loginId = form.loginId;
        if (!loginId || idCheck.checkedId === loginId) return;

        const message = validateLoginId(loginId);
        if (message) {
            setErrors((prev) => ({ ...prev, loginId: message }));
            return;
        }

        setIdCheck({ status: "checking", checkedId: loginId });

        try {
            const { available } = await checkLoginId(loginId);

            // 확인하는 동안 아이디를 다시 바꿨다면 이 결과는 버린다
            if (!mounted.current || latestLoginId.current !== loginId) return;

            setIdCheck({
                status: available ? "available" : "taken",
                checkedId: loginId,
            });
            if (!available) {
                setErrors((prev) => ({
                    ...prev,
                    loginId: "이미 사용 중인 아이디입니다.",
                }));
            }
        } catch (error) {
            if (!mounted.current || latestLoginId.current !== loginId) return;

            // 확인에 실패해도 가입은 막지 않는다 (서버가 가입 시 다시 중복을 검사한다)
            setIdCheck({ status: "idle", checkedId: "" });
            if (error instanceof ApiError && error.fieldErrors.loginId) {
                setErrors((prev) => ({
                    ...prev,
                    loginId: error.fieldErrors.loginId,
                }));
            }
        }
    }

    // 전체 입력 검사 (화면 1차 검사, 서버가 같은 규칙으로 다시 검사한다)
    function validateForm() {
        const next = Object.fromEntries(
            fieldOrder.map((field) => [field, validators[field](form[field])]),
        );

        // 이미 사용 중으로 확인된 아이디는 가입 요청을 보내지 않는다
        if (
            !next.loginId &&
            idCheck.status === "taken" &&
            idCheck.checkedId === form.loginId
        ) {
            next.loginId = "이미 사용 중인 아이디입니다.";
        }

        return next;
    }

    // 첫 번째 오류 항목으로 포커스 이동
    function focusFirstError(nextErrors) {
        const first = fieldOrder.find((field) => nextErrors[field]);
        if (first) {
            inputRefs.current[first]?.focus();
        }
    }

    // 가입 요청
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
            const member = await signup(form);
            if (!mounted.current) return;

            // 가입 완료 후 입력했던 비밀번호를 화면 상태에 남기지 않는다
            setForm(emptyForm);

            // 다음 행동: 로그인 화면으로 이동 (가입한 아이디를 안내용으로 전달)
            navigate("/login", {
                replace: true,
                state: { signedUpLoginId: member.loginId },
            });
        } catch (error) {
            if (!mounted.current) return;

            // 항목별 오류(중복·형식)는 해당 입력칸 아래에만 표시한다
            if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...error.fieldErrors }));
                focusFirstError(error.fieldErrors);

                if (error.code === "LOGIN_ID_DUPLICATED") {
                    setIdCheck({ status: "taken", checkedId: form.loginId });
                }
                return;
            }

            // 항목과 무관한 실패(네트워크 등)는 폼 아래에 표시한다
            setFormError(
                error instanceof ApiError
                    ? error.message
                    : "가입 처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
            );
        } finally {
            if (mounted.current) {
                setIsSubmitting(false);
            }
        }
    }

    // 입력 항목 공통 속성 (라벨 연결, 오류 안내 연결, 포커스 참조)
    function fieldProps(name) {
        return {
            id: `signup-${name}`,
            name,
            value: form[name],
            onChange: handleChange,
            ref: (element) => {
                inputRefs.current[name] = element;
            },
            "aria-invalid": Boolean(errors[name]),
            "aria-describedby": errors[name] ? `signup-${name}-error` : undefined,
            // 처리 중에는 수정만 막는다 (disabled면 오류 항목으로 포커스를 옮길 수 없다)
            readOnly: isSubmitting,
        };
    }

    const isIdAvailable =
        idCheck.status === "available" && idCheck.checkedId === form.loginId;

    return (
        <div className="page-stack">
            {/* 공통 페이지 배너 */}
            <Banner
                title="회원가입"
                description="도움을 찾고, 내일을 준비하는 첫걸음. ForGuide가 함께할게요."
            />

            {/* 공통 본문 박스 안의 입력 폼 */}
            <form
                className="panel"
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="signup-title"
            >
                <div className="auth-panel-head panel-title">
                    <h2 id="signup-title">ForGuide와 함께 시작해요</h2>
                    <ExampleBadge />
                </div>

                <div className="form-grid">
                    {/* 아이디 */}
                    <div className="form-field">
                        <label htmlFor="signup-loginId">아이디</label>
                        <input
                            {...fieldProps("loginId")}
                            type="text"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={20}
                            onBlur={handleLoginIdBlur}
                        />
                        {idCheck.status === "checking" && (
                            <p className="form-help" role="status">
                                아이디를 확인하고 있습니다…
                            </p>
                        )}
                        {isIdAvailable && !errors.loginId && (
                            <p className="auth-field-ok" role="status">
                                사용할 수 있는 아이디입니다.
                            </p>
                        )}
                        <FieldError id="signup-loginId-error" message={errors.loginId} />
                    </div>

                    {/* 비밀번호 + 보기 버튼 */}
                    <div className="form-field">
                        <label htmlFor="signup-password">비밀번호</label>
                        <div className="auth-password">
                            <input
                                {...fieldProps("password")}
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                maxLength={32}
                            />
                            <button
                                type="button"
                                className="auth-password-toggle"
                                aria-pressed={showPassword}
                                aria-controls="signup-password"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? "숨기기" : "보기"}
                            </button>
                        </div>
                        <FieldError id="signup-password-error" message={errors.password} />
                    </div>

                    {/* 이름 */}
                    <div className="form-field">
                        <label htmlFor="signup-name">이름</label>
                        <input
                            {...fieldProps("name")}
                            type="text"
                            autoComplete="name"
                        />
                        <FieldError id="signup-name-error" message={errors.name} />
                    </div>

                    {/* 이메일 */}
                    <div className="form-field">
                        <label htmlFor="signup-email">이메일</label>
                        <input
                            {...fieldProps("email")}
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            maxLength={254}
                        />
                        <FieldError id="signup-email-error" message={errors.email} />
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
                        {isSubmitting ? "가입 처리 중…" : "회원가입"}
                    </button>
                    <Link to="/login" className="button">
                        로그인
                    </Link>
                </div>
            </form>
        </div>
    );
}
