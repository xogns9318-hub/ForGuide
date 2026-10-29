import { useTranslation } from "react-i18next";
import FieldError from "../../components/FieldError/FieldError.jsx";
import { messageText } from "../utils/authMessages.js";
import styles from "../pages/AuthPage.module.css";

// 남은 초 → "9:05"
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
}

// 이메일 입력 + 인증 코드 받기 + 코드 확인 (회원가입·비밀번호 찾기 공통)
// - verification: useEmailVerification()의 결과
// - emailInputProps: 화면의 이메일 입력 속성 (id·name·value·onChange·ref·aria 등. 화면이 오류·포커스를 관리한다)
// - emailError: 이메일 칸 아래에 보일 메시지, onSendCode: "인증 코드 받기"를 눌렀을 때
// - disabled: 화면이 처리 중이면 코드 받기를 막는다
export default function EmailVerificationFields({
    idPrefix,
    verification,
    emailInputProps,
    emailError,
    onSendCode,
    disabled = false,
}) {
    const { t } = useTranslation();
    const v = verification;
    const isVerified = v.isVerifiedFor(emailInputProps.value);
    const isVerifying = v.status === "verifying";

    let sendLabel = t("auth.emailVerification.sendCode");
    if (v.status === "sending") sendLabel = t("auth.emailVerification.sendingCode");
    else if (v.isWaitingCode && v.resendWait > 0)
        sendLabel = t("auth.emailVerification.resendIn", { seconds: v.resendWait });
    else if (v.isWaitingCode) sendLabel = t("auth.emailVerification.resendCode");

    const sendDisabled =
        disabled || v.status === "sending" || isVerified || (v.isWaitingCode && v.resendWait > 0);

    // 비밀번호 찾기는 가입 여부를 드러내지 않으려고 "가입된 이메일이면 보냈다"고 안내한다
    const sentKey =
        v.purpose === "PASSWORD_RESET"
            ? "auth.emailVerification.codeSentIfRegistered"
            : "auth.emailVerification.codeSent";

    // 코드 입력칸에서 Enter: 폼 제출이 아니라 코드 확인
    function handleCodeKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            v.verifyCode();
        }
    }

    return (
        <>
            {/* 이메일 + 인증 코드 받기 */}
            <div className="form-field">
                <label htmlFor={emailInputProps.id}>{t("auth.emailVerification.email")}</label>
                <div className={styles.inputWithButton}>
                    <input
                        {...emailInputProps}
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        maxLength={254}
                    />
                    <button
                        type="button"
                        className="button"
                        onClick={onSendCode}
                        disabled={sendDisabled}
                    >
                        {sendLabel}
                    </button>
                </div>
                {v.isWaitingCode && (
                    <p className="form-help" role="status">
                        {t(sentKey, { email: v.email })}
                    </p>
                )}
                {isVerified && (
                    <p className={styles.ok} role="status">
                        {t("auth.emailVerification.verified")}
                    </p>
                )}
                <FieldError id={`${idPrefix}-email-error`} message={messageText(t, emailError)} />
            </div>

            {/* 인증 코드 입력 (코드를 보낸 뒤에만 보인다) */}
            {v.isWaitingCode && (
                <div className="form-field">
                    <label htmlFor={`${idPrefix}-code`}>{t("auth.emailVerification.code")}</label>
                    <div className={styles.inputWithButton}>
                        <input
                            id={`${idPrefix}-code`}
                            ref={v.codeInputRef}
                            value={v.code}
                            onChange={(event) => v.changeCode(event.target.value)}
                            onKeyDown={handleCodeKeyDown}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            aria-invalid={Boolean(v.codeError)}
                            aria-describedby={`${idPrefix}-code-time${v.codeError ? ` ${idPrefix}-code-error` : ""}`}
                            readOnly={isVerifying}
                        />
                        <button
                            type="button"
                            className="button button-primary"
                            onClick={v.verifyCode}
                            disabled={isVerifying}
                        >
                            {isVerifying
                                ? t("auth.emailVerification.verifyingCode")
                                : t("auth.emailVerification.verifyCode")}
                        </button>
                    </div>
                    <p id={`${idPrefix}-code-time`} className="form-help">
                        {v.secondsLeft > 0
                            ? t("auth.emailVerification.codeTimeLeft", {
                                  time: formatTime(v.secondsLeft),
                              })
                            : t("auth.errors.VERIFICATION_EXPIRED")}
                    </p>
                    <FieldError
                        id={`${idPrefix}-code-error`}
                        message={messageText(t, v.codeError)}
                    />
                </div>
            )}
        </>
    );
}
