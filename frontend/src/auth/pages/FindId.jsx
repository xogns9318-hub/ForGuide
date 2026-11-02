import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import EmailVerificationFields from "../components/EmailVerificationFields.jsx";
import { findLoginId } from "../api/authApi.js";
import { useEmailVerification } from "../useEmailVerification.js";
import { messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import styles from "./AuthPage.module.css";

// 아이디 찾기 (/find-id) — Figma에 화면이 없어 회원 화면과 같은 카드 형태로 둔다
// ① 이메일로 인증 코드 받기 → ② 코드 확인 → 확인되면 바로 가린 아이디를 보여 준다
export default function FindId() {
    const { t } = useTranslation();

    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [formError, setFormError] = useState("");
    const [maskedLoginId, setMaskedLoginId] = useState("");

    // 이메일 인증 (아이디 찾기용)
    const verification = useEmailVerification("FIND_ID");

    const emailRef = useRef(null);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // 인증을 마치면 바로 아이디를 받아 온다 (토큰은 한 번만 쓸 수 있어 받은 뒤 화면 상태에서 지운다)
    useEffect(() => {
        if (verification.status !== "verified") return;

        const request = { email: verification.email, verificationToken: verification.token };
        verification.reset();
        findLoginId(request)
            .then(({ maskedLoginId: loginId }) => {
                if (mounted.current) setMaskedLoginId(loginId);
            })
            .catch((error) => {
                if (!mounted.current) return;
                setFormError(
                    apiFieldErrors(error).email ?? apiErrorMessage(error, "auth.findId.failed"),
                );
            });
        // 인증이 끝난 순간 한 번만 실행한다
    }, [verification.status]);

    function handleChange(event) {
        setEmail(event.target.value);
        setEmailError("");
        setFormError("");
        verification.handleEmailChange(event.target.value);
    }

    // 인증 코드 받기: 실패 안내는 이메일 칸 아래에
    async function handleSendCode() {
        setEmailError("");
        setFormError("");
        const problem = await verification.sendCode(email);
        if (problem && mounted.current) {
            setEmailError(problem);
            emailRef.current?.focus();
        }
    }

    // 다음 행동: 로그인하거나, 비밀번호도 기억나지 않으면 비밀번호 찾기로
    const nextActions = (
        <div className={styles.actions}>
            <Link to="/login" className="button button-primary">
                {t("auth.findId.goLogin")}
            </Link>
            <Link to="/password/reset" className="button">
                {t("auth.findId.goPasswordReset")}
            </Link>
        </div>
    );

    return (
        <div className="page-stack">
            {/* Enter로 폼이 제출되지 않게 막는다 (코드 받기·확인은 각 버튼이 한다) */}
            <form
                className={`panel ${styles.card}`}
                onSubmit={(event) => event.preventDefault()}
                noValidate
                aria-labelledby="find-id-title"
            >
                <div className={styles.head}>
                    <h1 id="find-id-title" className={styles.title}>
                        {t("auth.findId.title")}
                    </h1>
                    <p className={styles.description}>{t("auth.findId.description")}</p>
                </div>

                {maskedLoginId ? (
                    // 결과: 일부를 가린 아이디
                    <>
                        <p className={styles.ok} role="status">
                            {t("auth.findId.result", { loginId: maskedLoginId })}
                        </p>
                        <p className="form-help">{t("auth.findId.maskedNotice")}</p>
                        {nextActions}
                    </>
                ) : (
                    <>
                        <div className={styles.fields}>
                            <EmailVerificationFields
                                idPrefix="find-id"
                                verification={verification}
                                emailInputProps={{
                                    id: "find-id-email",
                                    name: "email",
                                    value: email,
                                    onChange: handleChange,
                                    ref: emailRef,
                                    "aria-invalid": Boolean(emailError),
                                    "aria-describedby": emailError
                                        ? "find-id-email-error"
                                        : undefined,
                                }}
                                emailError={emailError}
                                onSendCode={handleSendCode}
                            />
                        </div>

                        {formError && (
                            <p className="form-error" role="alert">
                                {messageText(t, formError)}
                            </p>
                        )}

                        <div className={styles.actions}>
                            <Link to="/login" className="button">
                                {t("auth.passwordReset.backToLogin")}
                            </Link>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
