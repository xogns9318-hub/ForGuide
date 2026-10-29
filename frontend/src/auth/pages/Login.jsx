import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FieldError from "../../components/FieldError/FieldError.jsx";
import { login } from "../api/authApi.js";
import { msg, messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { getSafeNextPath } from "../utils/safeRedirect.js";
import styles from "./AuthPage.module.css";

// 입력 항목 순서 (오류가 있으면 이 순서대로 첫 항목에 포커스)
const fieldOrder = ["loginId", "password"];

// 로그인 화면 (Figma: 로그인 · 마이페이지로 이동, /login?next=/mypage)
export default function Login() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // 로그인 후 이동할 곳: ?next= 값 중 안전한 내부 경로만, 없으면 홈
    const nextPath = getSafeNextPath(searchParams.get("next"));

    // 회원가입·비밀번호 재설정 직후 넘어왔다면 아이디를 미리 채우고 완료 안내를 보여 준다
    // state: { prefillLoginId, notice: "signedUp" | "passwordReset" }
    const prefillLoginId = location.state?.prefillLoginId ?? "";
    const notice = location.state?.notice ?? "";

    const accessToken = useAuthStore((state) => state.accessToken);

    const [form, setForm] = useState({ loginId: prefillLoginId, password: "" });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputRefs = useRef({});
    const mounted = useRef(false);

    // 화면을 떠난 뒤 끝난 요청이 상태를 바꾸지 않도록 표시
    useEffect(() => {
        mounted.current = true;

        // 아이디가 채워져 있으면 비밀번호 칸부터 입력하게 한다
        if (prefillLoginId) {
            inputRefs.current.password?.focus();
        }

        return () => {
            mounted.current = false;
        };
    }, [prefillLoginId]);

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
            loginId: form.loginId ? "" : msg("auth.validation.loginIdRequired"),
            password: form.password ? "" : msg("auth.validation.passwordRequired"),
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

            const fieldErrors = apiFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
                focusFirstError(fieldErrors);
                return;
            }

            // LOGIN_FAILED: 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않는 안내를 표시
            // LOGIN_LOCKED: 5번 실패해 15분 동안 잠겼다는 안내 (서버가 아이디별로 센다)
            setFormError(apiErrorMessage(error, "auth.login.failed"));
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
            {/* 가운데 카드 안의 입력 폼 (한 줄에 한 항목) */}
            <form
                className={`panel ${styles.card}`}
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="login-title"
            >
                <div className={styles.head}>
                    <h1 id="login-title" className={styles.title}>
                        {t("auth.login.title")}
                    </h1>
                    <p className={styles.description}>{t("auth.login.heading")}</p>
                </div>

                {notice === "signedUp" && (
                    <p className={styles.ok} role="status">
                        {t("auth.login.signedUp")}
                    </p>
                )}
                {notice === "passwordReset" && (
                    <p className={styles.ok} role="status">
                        {t("auth.login.passwordReset")}
                    </p>
                )}

                <div className={styles.fields}>
                    {/* 아이디 */}
                    <div className="form-field">
                        <label htmlFor="login-loginId">{t("auth.common.loginId")}</label>
                        <input
                            {...fieldProps("loginId")}
                            type="text"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={20}
                        />
                        <FieldError
                            id="login-loginId-error"
                            message={messageText(t, errors.loginId)}
                        />
                    </div>

                    {/* 비밀번호 + 보기 버튼 */}
                    <div className="form-field">
                        <label htmlFor="login-password">{t("auth.common.password")}</label>
                        <div className={styles.password}>
                            <input
                                {...fieldProps("password")}
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                maxLength={32}
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                aria-pressed={showPassword}
                                aria-controls="login-password"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? t("auth.common.hide") : t("auth.common.show")}
                            </button>
                        </div>
                        <FieldError
                            id="login-password-error"
                            message={messageText(t, errors.password)}
                        />
                    </div>
                </div>

                {formError && (
                    <p className="form-error" role="alert">
                        {messageText(t, formError)}
                    </p>
                )}

                <div className={styles.actions}>
                    <button type="submit" className="button button-primary" disabled={isSubmitting}>
                        {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
                    </button>
                </div>

                {/* 비밀번호를 잊었으면 재설정으로, 계정이 없으면 회원가입으로 */}
                <p className={styles.switch}>
                    <Link to="/password/reset">{t("auth.login.forgotPassword")}</Link>
                </p>
                <p className={styles.switch}>
                    {t("auth.login.noAccount")}
                    <Link to="/signup">{t("auth.login.goSignup")}</Link>
                </p>
            </form>
        </div>
    );
}
