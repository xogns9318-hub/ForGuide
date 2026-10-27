import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FieldError from "../../components/FieldError/FieldError.jsx";
import { changePassword } from "../api/memberApi.js";
import { msg, messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import { validatePassword } from "../utils/authValidation.js";
import styles from "./AuthPage.module.css";

// 입력 항목 순서 (오류가 있으면 이 순서대로 첫 항목에 포커스)
const fieldOrder = ["currentPassword", "newPassword", "newPasswordConfirm"];

const emptyForm = { currentPassword: "", newPassword: "", newPasswordConfirm: "" };

// 비밀번호 변경 (/mypage/password) — Figma에 화면이 없어 프로필 수정과 같은 카드 형태로 둔다
// RequireAuth 안에서만 열린다
export default function PasswordChange() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const inputRefs = useRef({});
    const mounted = useRef(false);

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
    }

    // 화면 1차 검사 (서버가 같은 규칙으로 다시 검사한다)
    function validateForm() {
        const next = {
            currentPassword: form.currentPassword
                ? ""
                : msg("auth.validation.currentPasswordRequired"),
            newPassword: validatePassword(form.newPassword),
            newPasswordConfirm: "",
        };
        if (!next.newPassword && form.newPassword === form.currentPassword) {
            next.newPassword = msg("auth.validation.passwordSameAsCurrent");
        }
        if (form.newPasswordConfirm !== form.newPassword) {
            next.newPasswordConfirm = msg("auth.validation.passwordConfirmMismatch");
        }
        return next;
    }

    function focusFirstError(nextErrors) {
        const first = fieldOrder.find((field) => nextErrors[field]);
        if (first) inputRefs.current[first]?.focus();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSaving) return;

        const nextErrors = validateForm();
        setErrors(nextErrors);
        setFormError("");
        if (fieldOrder.some((field) => nextErrors[field])) {
            focusFirstError(nextErrors);
            return;
        }

        setIsSaving(true);
        try {
            // 성공하면 memberApi가 새 access token을 스토어에 넣는다 (이 기기는 로그인 유지)
            await changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            if (!mounted.current) return;

            // 입력했던 비밀번호를 화면 상태에 남기지 않는다
            setForm(emptyForm);

            // 다음 행동: 마이페이지로 돌아가 완료 안내를 본다
            navigate("/mypage", { replace: true, state: { passwordChanged: true } });
        } catch (error) {
            if (!mounted.current) return;

            // 보안: 실패하면 입력한 비밀번호를 지운다
            setForm(emptyForm);

            // 현재 비밀번호 틀림·새 비밀번호 규칙 위반은 해당 입력칸 아래에
            const fieldErrors = apiFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
                focusFirstError(fieldErrors);
                return;
            }

            // 잠김(LOGIN_LOCKED)·네트워크 오류 등은 폼 아래에
            setFormError(apiErrorMessage(error, "auth.passwordChange.failed"));
        } finally {
            if (mounted.current) setIsSaving(false);
        }
    }

    // 입력 항목 공통 속성 (라벨 연결, 오류 안내 연결, 포커스 참조)
    function fieldProps(name) {
        return {
            id: `password-${name}`,
            name,
            value: form[name],
            onChange: handleChange,
            ref: (element) => {
                inputRefs.current[name] = element;
            },
            type: showPassword ? "text" : "password",
            maxLength: 32,
            "aria-invalid": Boolean(errors[name]),
            "aria-describedby": errors[name] ? `password-${name}-error` : undefined,
            readOnly: isSaving,
        };
    }

    return (
        <div className="page-stack">
            <form
                className={`panel ${styles.card}`}
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="password-change-title"
            >
                <div className={styles.head}>
                    <h1 id="password-change-title" className={styles.title}>
                        {t("auth.passwordChange.title")}
                    </h1>
                    <p className={styles.description}>{t("auth.passwordChange.description")}</p>
                </div>

                <div className={styles.fields}>
                    {/* 현재 비밀번호 + 보기 버튼 (세 칸 모두 함께 보이고 숨긴다) */}
                    <div className="form-field">
                        <label htmlFor="password-currentPassword">
                            {t("auth.passwordChange.currentPassword")}
                        </label>
                        <div className={styles.password}>
                            <input
                                {...fieldProps("currentPassword")}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                aria-pressed={showPassword}
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? t("auth.common.hide") : t("auth.common.show")}
                            </button>
                        </div>
                        <FieldError
                            id="password-currentPassword-error"
                            message={messageText(t, errors.currentPassword)}
                        />
                    </div>

                    {/* 새 비밀번호 */}
                    <div className="form-field">
                        <label htmlFor="password-newPassword">
                            {t("auth.passwordChange.newPassword")}
                        </label>
                        <input {...fieldProps("newPassword")} autoComplete="new-password" />
                        <FieldError
                            id="password-newPassword-error"
                            message={messageText(t, errors.newPassword)}
                        />
                    </div>

                    {/* 새 비밀번호 확인 (화면에서만 검사) */}
                    <div className="form-field">
                        <label htmlFor="password-newPasswordConfirm">
                            {t("auth.passwordChange.newPasswordConfirm")}
                        </label>
                        <input {...fieldProps("newPasswordConfirm")} autoComplete="new-password" />
                        <FieldError
                            id="password-newPasswordConfirm-error"
                            message={messageText(t, errors.newPasswordConfirm)}
                        />
                    </div>
                </div>

                <p className="form-help">{t("auth.passwordChange.otherDevicesNotice")}</p>

                {formError && (
                    <p className="form-error" role="alert">
                        {messageText(t, formError)}
                    </p>
                )}

                <div className={styles.actions}>
                    <button type="submit" className="button button-primary" disabled={isSaving}>
                        {isSaving ? t("auth.common.saving") : t("auth.passwordChange.submit")}
                    </button>
                    <Link to="/mypage" className="button">
                        {t("auth.common.cancel")}
                    </Link>
                </div>
            </form>
        </div>
    );
}
