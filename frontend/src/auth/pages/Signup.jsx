import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FieldError from "../../components/FieldError/FieldError.jsx";
import { checkLoginId, sendEmailCode, signup, verifyEmailCode } from "../api/authApi.js";
import { msg, messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import {
    validateLoginId,
    validatePassword,
    validateGivenName,
    validateFamilyName,
    validateNickname,
    validateEmail,
    validateVerificationCode,
} from "../utils/authValidation.js";
import styles from "./AuthPage.module.css";

// 이메일 비교용 (서버와 같이 앞뒤 공백 제거 + 소문자)
function normalizeEmail(value) {
    return value.trim().toLowerCase();
}

// 남은 초 → "9:05"
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
}

// 이메일 인증 초기 상태
// status: idle(코드 받기 전) / sending / sent(코드 입력 대기) / verifying / verified
// email: 코드를 받은 이메일(정규화). 입력칸의 이메일이 바뀌면 인증은 처음부터 다시
// expiresAt·resendAt: 코드 만료 시각·다시 받기 가능 시각(ms), token: 인증 완료 토큰
const emptyEmailCheck = { status: "idle", email: "", token: "", expiresAt: 0, resendAt: 0 };

// 입력 항목 순서 (오류가 있으면 이 순서대로 첫 항목에 포커스)
const fieldOrder = ["loginId", "password", "givenName", "familyName", "nickname", "email"];

const emptyForm = {
    loginId: "",
    password: "",
    givenName: "",
    familyName: "",
    nickname: "",
    email: "",
};

// 항목별 검사 규칙
const validators = {
    loginId: validateLoginId,
    password: validatePassword,
    givenName: validateGivenName,
    familyName: validateFamilyName,
    nickname: validateNickname,
    email: validateEmail,
};

// 회원가입 화면 (Figma: 회원가입 · 입력, /signup)
export default function Signup() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 아이디 중복 확인 결과
    // status: idle(확인 전) / checking / available / taken
    // checkedId: 확인한 아이디. 입력값이 바뀌면 결과는 무효가 된다
    const [idCheck, setIdCheck] = useState({ status: "idle", checkedId: "" });

    // 이메일 인증 진행 상태와 입력한 인증 코드
    const [emailCheck, setEmailCheck] = useState(emptyEmailCheck);
    const [code, setCode] = useState("");
    const [codeError, setCodeError] = useState("");

    // 남은 시간 표시용 현재 시각 (코드 입력 대기 중에만 1초마다 갱신)
    const [now, setNow] = useState(() => Date.now());

    const inputRefs = useRef({});
    const codeInputRef = useRef(null);
    const mounted = useRef(false);

    // 지금 입력칸에 있는 아이디 (중복 확인 응답이 늦게 와도 현재 값과 비교하기 위해)
    const latestLoginId = useRef("");

    // 지금 입력칸에 있는 이메일 (인증 응답이 늦게 와도 현재 값과 비교하기 위해)
    const latestEmail = useRef("");

    // 화면을 떠난 뒤 끝난 요청이 상태를 바꾸지 않도록 표시
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // 코드를 보낸 뒤 확인 전까지 1초마다 시계를 돌린다 (남은 시간·다시 받기 대기 표시)
    const isWaitingCode = emailCheck.status === "sent" || emailCheck.status === "verifying";
    useEffect(() => {
        if (!isWaitingCode) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [isWaitingCode]);

    // 새 코드를 받으면 코드 입력칸으로 포커스 (입력칸은 코드를 받은 뒤에 그려지므로 그린 다음에 옮긴다)
    useEffect(() => {
        if (emailCheck.expiresAt) {
            codeInputRef.current?.focus();
        }
    }, [emailCheck.expiresAt]);

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

        // 코드를 받은 이메일과 달라지면 인증은 처음부터 다시 (받은 코드·토큰은 그 이메일 전용)
        if (name === "email") {
            latestEmail.current = normalizeEmail(value);
            if (emailCheck.status !== "idle" && emailCheck.email !== latestEmail.current) {
                setEmailCheck(emptyEmailCheck);
                setCode("");
                setCodeError("");
            }
        }
    }

    // 인증 코드 받기 (다시 받기도 같은 함수)
    async function handleSendCode() {
        const message = validateEmail(form.email);
        if (message) {
            setErrors((prev) => ({ ...prev, email: message }));
            inputRefs.current.email?.focus();
            return;
        }

        const email = normalizeEmail(form.email);
        const previous = emailCheck;
        setEmailCheck((prev) => ({ ...prev, status: "sending", email }));
        setErrors((prev) => ({ ...prev, email: "" }));
        setCodeError("");

        try {
            const { expiresInSeconds, resendAfterSeconds } = await sendEmailCode({
                email,
                purpose: "SIGNUP",
            });
            // 보내는 동안 이메일을 바꿨다면 이 결과는 버린다
            if (!mounted.current || latestEmail.current !== email) return;

            const sentAt = Date.now();
            setNow(sentAt);
            setEmailCheck({
                status: "sent",
                email,
                token: "",
                expiresAt: sentAt + expiresInSeconds * 1000,
                resendAt: sentAt + resendAfterSeconds * 1000,
            });
            setCode("");
        } catch (error) {
            if (!mounted.current || latestEmail.current !== email) return;

            // 보내지 못했으면 이전 상태로 (이미 받은 코드가 있으면 그 코드는 계속 쓸 수 있다)
            setEmailCheck(previous.status === "sent" ? previous : emptyEmailCheck);
            const fieldErrors = apiFieldErrors(error);
            setErrors((prev) => ({
                ...prev,
                email: fieldErrors.email ?? apiErrorMessage(error, "auth.signup.failed"),
            }));
        }
    }

    // 인증 코드 확인 → 성공하면 가입 요청에 쓸 토큰을 받아 둔다
    async function handleVerifyCode() {
        const message = validateVerificationCode(code);
        if (message) {
            setCodeError(message);
            codeInputRef.current?.focus();
            return;
        }

        const email = emailCheck.email;
        setEmailCheck((prev) => ({ ...prev, status: "verifying" }));
        setCodeError("");

        try {
            const { verificationToken } = await verifyEmailCode({
                email,
                purpose: "SIGNUP",
                code: code.trim(),
            });
            if (!mounted.current || latestEmail.current !== email) return;

            setEmailCheck((prev) => ({ ...prev, status: "verified", token: verificationToken }));
            setCode("");
            setErrors((prev) => ({ ...prev, email: "" }));
        } catch (error) {
            if (!mounted.current || latestEmail.current !== email) return;

            setEmailCheck((prev) => ({ ...prev, status: "sent" }));
            setCodeError(apiErrorMessage(error, "auth.signup.failed"));
            codeInputRef.current?.focus();
        }
    }

    // 인증 코드 입력칸에서 Enter: 가입 제출이 아니라 코드 확인
    function handleCodeKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            handleVerifyCode();
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
                    loginId: msg("auth.errors.LOGIN_ID_DUPLICATED"),
                }));
            }
        } catch (error) {
            if (!mounted.current || latestLoginId.current !== loginId) return;

            // 확인에 실패해도 가입은 막지 않는다 (서버가 가입 시 다시 중복을 검사한다)
            setIdCheck({ status: "idle", checkedId: "" });
            const fieldErrors = apiFieldErrors(error);
            if (fieldErrors.loginId) {
                setErrors((prev) => ({ ...prev, loginId: fieldErrors.loginId }));
            }
        }
    }

    // 전체 입력 검사 (화면 1차 검사, 서버가 같은 규칙으로 다시 검사한다)
    function validateForm() {
        const next = Object.fromEntries(
            fieldOrder.map((field) => [field, validators[field](form[field])]),
        );

        // 이미 사용 중으로 확인된 아이디는 가입 요청을 보내지 않는다
        if (!next.loginId && idCheck.status === "taken" && idCheck.checkedId === form.loginId) {
            next.loginId = msg("auth.errors.LOGIN_ID_DUPLICATED");
        }

        // 형식이 맞는 이메일이라도 인증을 마쳐야 가입 요청을 보낸다
        if (!next.email && !isEmailVerified) {
            next.email = msg("auth.signup.emailNotVerified");
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
            const member = await signup({ ...form, emailVerificationToken: emailCheck.token });
            if (!mounted.current) return;

            // 가입 완료 후 입력했던 비밀번호·인증 토큰을 화면 상태에 남기지 않는다
            setForm(emptyForm);
            setEmailCheck(emptyEmailCheck);

            // 다음 행동: 로그인 화면으로 이동 (가입한 아이디를 안내용으로 전달)
            navigate("/login", {
                replace: true,
                state: { signedUpLoginId: member.loginId },
            });
        } catch (error) {
            if (!mounted.current) return;

            // 항목별 오류(중복·형식)는 해당 입력칸 아래에만 표시한다
            const fieldErrors = apiFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
                focusFirstError(fieldErrors);

                if (error.code === "LOGIN_ID_DUPLICATED") {
                    setIdCheck({ status: "taken", checkedId: form.loginId });
                }
                // 토큰이 만료됐거나 이미 쓰였으면 인증을 처음부터 다시 받게 한다
                if (error.code === "EMAIL_NOT_VERIFIED") {
                    setEmailCheck(emptyEmailCheck);
                }
                return;
            }

            // 항목과 무관한 실패(네트워크 등)는 폼 아래에 표시한다
            setFormError(apiErrorMessage(error, "auth.signup.failed"));
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

    const isIdAvailable = idCheck.status === "available" && idCheck.checkedId === form.loginId;

    // 이메일 인증 화면 표시용 값
    const isEmailVerified =
        emailCheck.status === "verified" && emailCheck.email === normalizeEmail(form.email);
    const secondsLeft = Math.max(0, Math.ceil((emailCheck.expiresAt - now) / 1000));
    const resendWait = Math.max(0, Math.ceil((emailCheck.resendAt - now) / 1000));
    const sendDisabled =
        isSubmitting ||
        emailCheck.status === "sending" ||
        isEmailVerified ||
        (isWaitingCode && resendWait > 0);

    let sendLabel = t("auth.signup.sendCode");
    if (emailCheck.status === "sending") sendLabel = t("auth.signup.sendingCode");
    else if (isWaitingCode && resendWait > 0)
        sendLabel = t("auth.signup.resendIn", { seconds: resendWait });
    else if (isWaitingCode) sendLabel = t("auth.signup.resendCode");

    return (
        <div className="page-stack">
            {/* 가운데 카드 안의 입력 폼 (한 줄에 한 항목) */}
            <form
                className={`panel ${styles.card}`}
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="signup-title"
            >
                <div className={styles.head}>
                    <h1 id="signup-title" className={styles.title}>
                        {t("auth.signup.title")}
                    </h1>
                    <p className={styles.description}>{t("auth.signup.heading")}</p>
                </div>

                <div className={styles.fields}>
                    {/* 아이디 */}
                    <div className="form-field">
                        <label htmlFor="signup-loginId">{t("auth.common.loginId")}</label>
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
                                {t("auth.signup.checkingLoginId")}
                            </p>
                        )}
                        {isIdAvailable && !errors.loginId && (
                            <p className={styles.ok} role="status">
                                {t("auth.signup.loginIdAvailable")}
                            </p>
                        )}
                        <FieldError
                            id="signup-loginId-error"
                            message={messageText(t, errors.loginId)}
                        />
                    </div>

                    {/* 비밀번호 + 보기 버튼 */}
                    <div className="form-field">
                        <label htmlFor="signup-password">{t("auth.common.password")}</label>
                        <div className={styles.password}>
                            <input
                                {...fieldProps("password")}
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                maxLength={32}
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                aria-pressed={showPassword}
                                aria-controls="signup-password"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? t("auth.common.hide") : t("auth.common.show")}
                            </button>
                        </div>
                        <FieldError
                            id="signup-password-error"
                            message={messageText(t, errors.password)}
                        />
                    </div>

                    {/* 이름 (필수) */}
                    <div className="form-field">
                        <label htmlFor="signup-givenName">{t("auth.signup.givenName")}</label>
                        <input
                            {...fieldProps("givenName")}
                            type="text"
                            autoComplete="given-name"
                            maxLength={50}
                        />
                        <FieldError
                            id="signup-givenName-error"
                            message={messageText(t, errors.givenName)}
                        />
                    </div>

                    {/* 성 (선택: 성이 없는 문화권 사용자는 비워 둔다) */}
                    <div className="form-field">
                        <label htmlFor="signup-familyName">
                            {t("auth.signup.familyName")}{" "}
                            <span className="text-muted">{t("auth.common.optional")}</span>
                        </label>
                        <input
                            {...fieldProps("familyName")}
                            type="text"
                            autoComplete="family-name"
                            maxLength={50}
                        />
                        <FieldError
                            id="signup-familyName-error"
                            message={messageText(t, errors.familyName)}
                        />
                    </div>

                    {/* 닉네임 (커뮤니티에 보이는 이름) */}
                    <div className="form-field">
                        <label htmlFor="signup-nickname">{t("auth.signup.nickname")}</label>
                        <input
                            {...fieldProps("nickname")}
                            type="text"
                            autoComplete="nickname"
                            aria-describedby={`signup-nickname-help${errors.nickname ? " signup-nickname-error" : ""}`}
                        />
                        <p id="signup-nickname-help" className="form-help">
                            {t("auth.signup.nicknameHelp")}
                        </p>
                        <FieldError
                            id="signup-nickname-error"
                            message={messageText(t, errors.nickname)}
                        />
                    </div>

                    {/* 이메일 + 인증 코드 받기 */}
                    <div className="form-field">
                        <label htmlFor="signup-email">{t("auth.signup.email")}</label>
                        <div className={styles.inputWithButton}>
                            <input
                                {...fieldProps("email")}
                                type="email"
                                autoComplete="email"
                                inputMode="email"
                                maxLength={254}
                            />
                            <button
                                type="button"
                                className="button"
                                onClick={handleSendCode}
                                disabled={sendDisabled}
                            >
                                {sendLabel}
                            </button>
                        </div>
                        {isWaitingCode && (
                            <p className="form-help" role="status">
                                {t("auth.signup.codeSent", { email: emailCheck.email })}
                            </p>
                        )}
                        {isEmailVerified && (
                            <p className={styles.ok} role="status">
                                {t("auth.signup.emailVerified")}
                            </p>
                        )}
                        <FieldError
                            id="signup-email-error"
                            message={messageText(t, errors.email)}
                        />
                    </div>

                    {/* 인증 코드 입력 (코드를 보낸 뒤에만 보인다) */}
                    {isWaitingCode && (
                        <div className="form-field">
                            <label htmlFor="signup-code">{t("auth.signup.code")}</label>
                            <div className={styles.inputWithButton}>
                                <input
                                    id="signup-code"
                                    ref={codeInputRef}
                                    value={code}
                                    onChange={(event) => {
                                        setCode(event.target.value);
                                        setCodeError("");
                                    }}
                                    onKeyDown={handleCodeKeyDown}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    aria-invalid={Boolean(codeError)}
                                    aria-describedby={`signup-code-time${codeError ? " signup-code-error" : ""}`}
                                    readOnly={emailCheck.status === "verifying"}
                                />
                                <button
                                    type="button"
                                    className="button button-primary"
                                    onClick={handleVerifyCode}
                                    disabled={emailCheck.status === "verifying"}
                                >
                                    {emailCheck.status === "verifying"
                                        ? t("auth.signup.verifyingCode")
                                        : t("auth.signup.verifyCode")}
                                </button>
                            </div>
                            <p id="signup-code-time" className="form-help">
                                {secondsLeft > 0
                                    ? t("auth.signup.codeTimeLeft", {
                                          time: formatTime(secondsLeft),
                                      })
                                    : t("auth.errors.VERIFICATION_EXPIRED")}
                            </p>
                            <FieldError
                                id="signup-code-error"
                                message={messageText(t, codeError)}
                            />
                        </div>
                    )}
                </div>

                {formError && (
                    <p className="form-error" role="alert">
                        {messageText(t, formError)}
                    </p>
                )}

                <div className={styles.actions}>
                    <button type="submit" className="button button-primary" disabled={isSubmitting}>
                        {isSubmitting ? t("auth.signup.submitting") : t("auth.signup.submit")}
                    </button>
                </div>

                {/* 이미 계정이 있으면 로그인으로 */}
                <p className={styles.switch}>
                    {t("auth.signup.haveAccount")}
                    <Link to="/login">{t("auth.signup.goLogin")}</Link>
                </p>
            </form>
        </div>
    );
}
