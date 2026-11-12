import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FieldError from "../../components/FieldError/FieldError.jsx";
import EmailVerificationFields from "../components/EmailVerificationFields.jsx";
import { checkLoginId, signup } from "../api/authApi.js";
import { useEmailVerification } from "../useEmailVerification.js";
import { msg, messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import {
    validateLoginId,
    validatePassword,
    validateGivenName,
    validateFamilyName,
    validateNickname,
    validateEmail,
    passwordChecks,
    hasInvalidPasswordChars,
} from "../utils/authValidation.js";
import styles from "./AuthPage.module.css";

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

// 최대 글자 수 (서버와 같은 기준, 이모지도 한 글자)
// 입력칸 maxLength는 이모지를 2글자로 센다. 그래서 여러 언어를 쓰는 이름·닉네임은 여기서 직접 자르고,
// 나머지는 maxLength를 그대로 쓴다 (아이디·비밀번호는 영문 자판 문자만 허용,
// 이메일은 서버 @Size·화면 검사도 maxLength와 같은 방식으로 센다)
const charLimits = {
    givenName: 50,
    familyName: 50,
    nickname: 20,
};

// 최대 글자 수를 넘으면 뒤를 잘라 낸다. 코드 포인트 단위(Array.from)로 세어 이모지도 한 글자
function limitChars(text, max) {
    const chars = Array.from(text);
    return chars.length > max ? chars.slice(0, max).join("") : text;
}

// 입력칸 아래 조건 안내 문구 키 (비밀번호는 조건별 목록, 이메일은 인증 안내로 따로 표시)
const helpKeys = {
    loginId: "auth.signup.loginIdHelp",
    givenName: "auth.signup.nameHelp",
    familyName: "auth.signup.familyNameHelp",
    nickname: "auth.signup.nicknameHelp",
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

    // 최대 글자 수를 넘어 잘린 항목 ({ nickname: true }) → 잘렸다는 안내를 보여 준다 (말없이 잘리면 헷갈리므로)
    // 그 항목을 다시 입력해 잘리지 않으면 안내를 지운다
    const [cutFields, setCutFields] = useState({});

    // 아이디 중복 확인 결과
    // status: idle(확인 전) / checking / available / taken
    // checkedId: 확인한 아이디. 입력값이 바뀌면 결과는 무효가 된다
    const [idCheck, setIdCheck] = useState({ status: "idle", checkedId: "" });

    // 이메일 인증 (코드 받기·확인·남은 시간)
    const verification = useEmailVerification("SIGNUP");

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

    // 인증을 마치면 이메일 칸의 "인증을 완료해주세요" 안내를 지운다
    useEffect(() => {
        if (verification.status === "verified") {
            setErrors((prev) => ({ ...prev, email: "" }));
        }
    }, [verification.status]);

    // 입력값 변경: 해당 항목의 이전 오류와 폼 전체 오류를 지운다
    function handleChange(event) {
        const { name } = event.target;
        let { value } = event.target;

        // 최대 글자 수를 넘으면 더 입력되지 않게 자른다
        // 한글·일본어 등을 조합하는 중에는 자르면 글자가 깨지므로 조합이 끝난 뒤(handleCompositionEnd) 자른다
        if (charLimits[name] && !event.nativeEvent.isComposing) {
            const limited = limitChars(value, charLimits[name]);
            markCut(name, limited !== value);
            value = limited;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({
            ...prev,
            // 비밀번호에 공백·한글 등을 넣으면 입력하는 즉시 알려 준다 (나머지 조건은 목록으로 표시)
            [name]:
                name === "password" && hasInvalidPasswordChars(value)
                    ? msg("auth.validation.passwordCharacters")
                    : "",
        }));
        setFormError("");

        // 아이디를 바꾸면 이전 중복 확인 결과는 무효
        if (name === "loginId") {
            latestLoginId.current = value;
            setIdCheck({ status: "idle", checkedId: "" });
        }

        // 이메일을 바꾸면 그 이메일로 받은 인증은 무효
        if (name === "email") {
            verification.handleEmailChange(value);
        }
    }

    // 글자 조합(IME)이 끝나면 최대 글자 수에 맞춰 자른다
    function handleCompositionEnd(event) {
        const { name, value } = event.target;
        if (!charLimits[name]) return;

        const limited = limitChars(value, charLimits[name]);
        markCut(name, limited !== value);
        if (limited !== value) {
            setForm((prev) => ({ ...prev, [name]: limited }));
        }
    }

    // 잘림 안내 표시 여부 갱신
    function markCut(name, wasCut) {
        setCutFields((prev) => (prev[name] === wasCut ? prev : { ...prev, [name]: wasCut }));
    }

    // 입력칸을 벗어나면 형식 오류를 바로 보여 준다 (빈 칸은 가입 버튼을 누를 때 안내)
    // 아이디는 중복 확인까지 하는 handleLoginIdBlur, 비밀번호는 조건 목록이 대신한다
    function handleFieldBlur(event) {
        const { name, value } = event.target;
        if (!value.trim()) return;

        const message = validators[name](value);
        if (message) {
            setErrors((prev) => ({ ...prev, [name]: message }));
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
        if (!next.email && !verification.isVerifiedFor(form.email)) {
            next.email = msg("auth.errors.EMAIL_NOT_VERIFIED");
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
            const member = await signup({ ...form, emailVerificationToken: verification.token });
            if (!mounted.current) return;

            // 가입 완료 후 입력했던 비밀번호·인증 토큰을 화면 상태에 남기지 않는다
            setForm(emptyForm);
            verification.reset();

            // 다음 행동: 로그인 화면으로 이동 (가입한 아이디를 미리 채우고 완료 안내)
            navigate("/login", {
                replace: true,
                state: { prefillLoginId: member.loginId, notice: "signedUp" },
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
                    verification.reset();
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

    // 입력 항목 공통 속성 (라벨 연결, 조건 안내·오류 안내 연결, 포커스 참조)
    function fieldProps(name, { hasHelp = false } = {}) {
        const describedBy = [
            hasHelp && `signup-${name}-help`,
            errors[name] && `signup-${name}-error`,
        ].filter(Boolean);

        return {
            id: `signup-${name}`,
            name,
            value: form[name],
            onChange: handleChange,
            onCompositionEnd: handleCompositionEnd,
            ref: (element) => {
                inputRefs.current[name] = element;
            },
            "aria-invalid": Boolean(errors[name]),
            "aria-describedby": describedBy.length > 0 ? describedBy.join(" ") : undefined,
            // 처리 중에는 수정만 막는다 (disabled면 오류 항목으로 포커스를 옮길 수 없다)
            readOnly: isSubmitting,
        };
    }

    // 입력칸 아래 조건 안내 한 줄
    // 글자 수 제한이 있는 항목은 오른쪽에 "지금 글자 수/최대"를 함께 보여 주고, 잘렸으면 안내를 덧붙인다
    function fieldHelp(name) {
        const help = (
            <p id={`signup-${name}-help`} className="form-help">
                {t(helpKeys[name])}
            </p>
        );

        const max = charLimits[name];
        if (!max) return help;

        // 조합 중에는 잠깐 최대보다 많을 수 있어 표시는 최대에서 멈춘다 (조합이 끝나면 잘린다)
        const count = Math.min(Array.from(form[name]).length, max);

        return (
            <>
                <div className={styles.helpRow}>
                    {help}
                    <span className={styles.charCount}>
                        {t("auth.signup.charCount", { count, max })}
                    </span>
                </div>
                {cutFields[name] && (
                    <p className="form-help" role="status">
                        {t("auth.signup.charLimitReached", { max })}
                    </p>
                )}
            </>
        );
    }

    const isIdAvailable = idCheck.status === "available" && idCheck.checkedId === form.loginId;
    const isEmailVerified = verification.isVerifiedFor(form.email);

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
                            {...fieldProps("loginId", { hasHelp: true })}
                            type="text"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={20}
                            onBlur={handleLoginIdBlur}
                        />
                        {fieldHelp("loginId")}
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
                                {...fieldProps("password", { hasHelp: true })}
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
                        {/* 비밀번호 조건별 충족 여부 (입력하는 동안 바로 바뀐다) */}
                        <ul id="signup-password-help" className={styles.rules}>
                            {passwordChecks(form.password).map(({ key, met }) => (
                                <li key={key} className={met ? styles.ruleMet : undefined}>
                                    <span aria-hidden="true">{met ? "✓" : "•"}</span>
                                    {t(`auth.signup.passwordRules.${key}`)}
                                    <span className={styles.srOnly}>
                                        {met
                                            ? t("auth.signup.passwordRules.met")
                                            : t("auth.signup.passwordRules.notMet")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <FieldError
                            id="signup-password-error"
                            message={messageText(t, errors.password)}
                        />
                    </div>

                    {/* 이름 (필수) */}
                    <div className="form-field">
                        <label htmlFor="signup-givenName">{t("auth.signup.givenName")}</label>
                        <input
                            {...fieldProps("givenName", { hasHelp: true })}
                            type="text"
                            autoComplete="given-name"
                            onBlur={handleFieldBlur}
                        />
                        {fieldHelp("givenName")}
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
                            {...fieldProps("familyName", { hasHelp: true })}
                            type="text"
                            autoComplete="family-name"
                            onBlur={handleFieldBlur}
                        />
                        {fieldHelp("familyName")}
                        <FieldError
                            id="signup-familyName-error"
                            message={messageText(t, errors.familyName)}
                        />
                    </div>

                    {/* 닉네임 (커뮤니티에 보이는 이름) */}
                    <div className="form-field">
                        <label htmlFor="signup-nickname">{t("auth.signup.nickname")}</label>
                        <input
                            {...fieldProps("nickname", { hasHelp: true })}
                            type="text"
                            autoComplete="nickname"
                            onBlur={handleFieldBlur}
                        />
                        {fieldHelp("nickname")}
                        <FieldError
                            id="signup-nickname-error"
                            message={messageText(t, errors.nickname)}
                        />
                    </div>

                    {/* 이메일 + 인증 코드 받기·확인 */}
                    <EmailVerificationFields
                        idPrefix="signup"
                        verification={verification}
                        emailInputProps={{
                            ...fieldProps("email", { hasHelp: !isEmailVerified }),
                            onBlur: handleFieldBlur,
                        }}
                        emailHelp={isEmailVerified ? "" : t("auth.signup.emailHelp")}
                        emailError={errors.email}
                        onSendCode={handleSendCode}
                        disabled={isSubmitting}
                    />
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
