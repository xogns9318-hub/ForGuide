import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FieldError from "../../components/FieldError/FieldError.jsx";
import EmailVerificationFields from "../components/EmailVerificationFields.jsx";
import { resetPassword } from "../api/authApi.js";
import { useEmailVerification } from "../useEmailVerification.js";
import { msg, messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import { validatePassword } from "../utils/authValidation.js";
import styles from "./AuthPage.module.css";

// 입력 항목 순서 (오류가 있으면 이 순서대로 첫 항목에 포커스)
const fieldOrder = ["email", "newPassword", "newPasswordConfirm"];

const emptyForm = { email: "", newPassword: "", newPasswordConfirm: "" };

// 비밀번호 찾기 (/password/reset) — Figma에 화면이 없어 회원 화면과 같은 카드 형태로 둔다
// ① 이메일로 인증 코드 받기 → ② 코드 확인 → ③ 새 비밀번호 입력 (인증을 마치면 나타난다)
export default function PasswordReset() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 이메일 인증 (비밀번호 재설정용)
    const verification = useEmailVerification("PASSWORD_RESET");
    const isVerified = verification.isVerifiedFor(form.email);

    const inputRefs = useRef({});
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // 인증을 마치면 이메일 칸 안내를 지우고 새 비밀번호 칸으로 포커스
    useEffect(() => {
        if (verification.status === "verified") {
            setErrors((prev) => ({ ...prev, email: "" }));
            inputRefs.current.newPassword?.focus();
        }
    }, [verification.status]);

    // 입력값 변경: 해당 항목의 이전 오류와 폼 전체 오류를 지운다
    function handleChange(event) {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setFormError("");

        // 이메일을 바꾸면 그 이메일로 받은 인증은 무효
        if (name === "email") {
            verification.handleEmailChange(value);
        }
    }

    // 인증 코드 받기: 실패 안내는 이메일 칸 아래에
    async function handleSendCode() {
        setErrors((prev) => ({ ...prev, email: "" }));
        const problem = await verification.sendCode(form.email);
        if (problem && mounted.current) {
            setErrors((prev) => ({ ...prev, email: problem }));
            inputRefs.current.email?.focus();
        }
    }

    // 화면 1차 검사 (서버가 같은 규칙으로 다시 검사한다)
    function validateForm() {
        // 인증 전에는 새 비밀번호 칸이 보이지 않으므로 이메일 안내만 한다
        if (!isVerified) {
            return { email: msg("auth.errors.EMAIL_NOT_VERIFIED") };
        }
        return {
            email: "",
            newPassword: validatePassword(form.newPassword),
            newPasswordConfirm:
                form.newPasswordConfirm === form.newPassword
                    ? ""
                    : msg("auth.validation.passwordConfirmMismatch"),
        };
    }

    function focusFirstError(nextErrors) {
        const first = fieldOrder.find((field) => nextErrors[field]);
        if (first) inputRefs.current[first]?.focus();
    }

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
            const { loginId } = await resetPassword({
                email: verification.email,
                verificationToken: verification.token,
                newPassword: form.newPassword,
            });
            if (!mounted.current) return;

            // 입력했던 비밀번호·인증 토큰을 화면 상태에 남기지 않는다
            setForm(emptyForm);
            verification.reset();

            // 다음 행동: 로그인 화면에서 새 비밀번호로 로그인 (아이디는 미리 채운다)
            navigate("/login", {
                replace: true,
                state: { prefillLoginId: loginId, notice: "passwordReset" },
            });
        } catch (error) {
            if (!mounted.current) return;

            // 토큰이 만료됐거나 이미 쓰였으면 인증을 처음부터 다시 받게 한다
            if (error.code === "EMAIL_NOT_VERIFIED") {
                verification.reset();
            }

            const fieldErrors = apiFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
                focusFirstError(fieldErrors);
                return;
            }
            setFormError(apiErrorMessage(error, "auth.passwordReset.failed"));
        } finally {
            if (mounted.current) setIsSubmitting(false);
        }
    }

    // 입력 항목 공통 속성 (라벨 연결, 오류 안내 연결, 포커스 참조)
    function fieldProps(name) {
        return {
            id: `reset-${name}`,
            name,
            value: form[name],
            onChange: handleChange,
            ref: (element) => {
                inputRefs.current[name] = element;
            },
            "aria-invalid": Boolean(errors[name]),
            "aria-describedby": errors[name] ? `reset-${name}-error` : undefined,
            readOnly: isSubmitting,
        };
    }

    return (
        <div className="page-stack">
            <form
                className={`panel ${styles.card}`}
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="password-reset-title"
            >
                <div className={styles.head}>
                    <h1 id="password-reset-title" className={styles.title}>
                        {t("auth.passwordReset.title")}
                    </h1>
                    <p className={styles.description}>{t("auth.passwordReset.description")}</p>
                </div>

                <div className={styles.fields}>
                    {/* ①② 이메일 + 인증 코드 받기·확인 */}
                    <EmailVerificationFields
                        idPrefix="reset"
                        verification={verification}
                        emailInputProps={fieldProps("email")}
                        emailError={errors.email}
                        onSendCode={handleSendCode}
                        disabled={isSubmitting}
                    />

                    {/* ③ 새 비밀번호 (인증을 마친 뒤에만 보인다) */}
                    {isVerified && (
                        <>
                            <div className="form-field">
                                <label htmlFor="reset-newPassword">
                                    {t("auth.passwordChange.newPassword")}
                                </label>
                                <div className={styles.password}>
                                    <input
                                        {...fieldProps("newPassword")}
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        maxLength={32}
                                    />
                                    <button
                                        type="button"
                                        className={styles.passwordToggle}
                                        aria-pressed={showPassword}
                                        onClick={() => setShowPassword((prev) => !prev)}
                                    >
                                        {showPassword
                                            ? t("auth.common.hide")
                                            : t("auth.common.show")}
                                    </button>
                                </div>
                                <FieldError
                                    id="reset-newPassword-error"
                                    message={messageText(t, errors.newPassword)}
                                />
                            </div>

                            <div className="form-field">
                                <label htmlFor="reset-newPasswordConfirm">
                                    {t("auth.passwordChange.newPasswordConfirm")}
                                </label>
                                <input
                                    {...fieldProps("newPasswordConfirm")}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    maxLength={32}
                                />
                                <FieldError
                                    id="reset-newPasswordConfirm-error"
                                    message={messageText(t, errors.newPasswordConfirm)}
                                />
                            </div>
                        </>
                    )}
                </div>

                {isVerified && (
                    <p className="form-help">{t("auth.passwordReset.allDevicesNotice")}</p>
                )}

                {formError && (
                    <p className="form-error" role="alert">
                        {messageText(t, formError)}
                    </p>
                )}

                <div className={styles.actions}>
                    {isVerified && (
                        <button
                            type="submit"
                            className="button button-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? t("auth.common.saving")
                                : t("auth.passwordReset.submit")}
                        </button>
                    )}
                    <Link to="/login" className="button">
                        {t("auth.passwordReset.backToLogin")}
                    </Link>
                </div>
            </form>
        </div>
    );
}
