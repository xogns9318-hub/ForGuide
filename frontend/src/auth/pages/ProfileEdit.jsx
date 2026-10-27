import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FieldError from "../../components/FieldError/FieldError.jsx";
import { languages } from "../../routes/routeConfig.js";
import { getProfile, updateNickname, updateProfile } from "../api/memberApi.js";
import { msg, messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { validateNickname } from "../utils/authValidation.js";
import styles from "./AuthPage.module.css";

// 체류 유형 "내국인" 코드 (서버 V27). 내국인은 체류자격을 고르지 않는다
const KOREAN = "KOREAN";

// 입력 항목 순서 (오류가 있으면 이 순서대로 첫 항목에 포커스)
const fieldOrder = ["nickname", "language", "residenceTypeCode", "visaTypeCode", "job"];

// 프로필 수정 (Figma: 프로필 수정 · 기본 정보, /mypage/edit)
// 닉네임과 프로필(사용 언어·체류 유형·체류자격·직업)을 한 번에 저장한다
// RequireAuth 안에서만 열리므로 로그인한 회원 정보가 있다
export default function ProfileEdit() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const member = useAuthStore((state) => state.member);

    // 처음 값: 닉네임은 현재 값, 프로필은 서버에서 불러온 뒤 채운다
    const [form, setForm] = useState({
        nickname: member?.nickname ?? "",
        language: "",
        residenceTypeCode: "",
        visaTypeCode: "",
        job: "",
    });
    const [choices, setChoices] = useState(null); // 서버가 준 선택지 (불러오기 전에는 null)
    const [loadError, setLoadError] = useState("");
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const inputRefs = useRef({});
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // 프로필 불러오기: 저장한 적 없으면 사용 언어는 지금 화면 언어로 미리 고른다
    useEffect(() => {
        let ignore = false;
        getProfile()
            .then((profile) => {
                if (ignore) return;
                const current = profile.choices.languages.includes(i18n.language)
                    ? i18n.language
                    : "ko";
                setChoices(profile.choices);
                setForm((prev) => ({
                    ...prev,
                    language: profile.language ?? current,
                    residenceTypeCode: profile.residenceTypeCode ?? "",
                    visaTypeCode: profile.visaTypeCode ?? "",
                    job: profile.job ?? "",
                }));
            })
            .catch((error) => {
                if (!ignore) setLoadError(apiErrorMessage(error, "auth.profileEdit.loadFailed"));
            });
        return () => {
            ignore = true;
        };
        // 처음 한 번만 불러온다 (화면 언어를 바꿔도 다시 부르지 않는다)
    }, []);

    // 입력값 변경: 해당 항목의 이전 오류와 폼 전체 오류를 지운다
    function handleChange(event) {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
            // 내국인을 고르면 체류자격은 비운다 (서버도 저장하지 않는다)
            ...(name === "residenceTypeCode" && value === KOREAN ? { visaTypeCode: "" } : {}),
        }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        setFormError("");
    }

    function focusFirstError(nextErrors) {
        const first = fieldOrder.find((field) => nextErrors[field]);
        if (first) inputRefs.current[first]?.focus();
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSaving || !choices) return;

        // 화면 1차 검사 (서버가 같은 규칙으로 다시 검사한다)
        const nextErrors = {
            nickname: validateNickname(form.nickname),
            job: form.job.trim().length > 50 ? msg("auth.validation.nameLength", { max: 50 }) : "",
        };
        setErrors(nextErrors);
        setFormError("");
        if (fieldOrder.some((field) => nextErrors[field])) {
            focusFirstError(nextErrors);
            return;
        }

        setIsSaving(true);
        try {
            // 닉네임은 바뀐 경우에만 저장 (성공하면 memberApi가 스토어의 회원 정보를 갱신한다)
            if (form.nickname.trim() !== (member?.nickname ?? "")) {
                await updateNickname(form.nickname);
            }
            await updateProfile({
                language: form.language,
                residenceTypeCode: form.residenceTypeCode,
                visaTypeCode: form.residenceTypeCode === KOREAN ? "" : form.visaTypeCode,
                job: form.job,
            });
            if (!mounted.current) return;

            // 다음 행동: 마이페이지로 돌아간다
            navigate("/mypage", { replace: true });
        } catch (saveError) {
            if (!mounted.current) return;

            // 항목별 오류는 해당 입력칸 아래에, 그 밖의 실패는 폼 아래에
            const fieldErrors = apiFieldErrors(saveError);
            if (Object.keys(fieldErrors).length > 0) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }));
                focusFirstError(fieldErrors);
                return;
            }
            setFormError(apiErrorMessage(saveError, "auth.profileEdit.saveFailed"));
        } finally {
            if (mounted.current) setIsSaving(false);
        }
    }

    // 입력 항목 공통 속성 (라벨 연결, 오류 안내 연결, 포커스 참조)
    function fieldProps(name) {
        return {
            id: `profile-${name}`,
            name,
            value: form[name],
            onChange: handleChange,
            ref: (element) => {
                inputRefs.current[name] = element;
            },
            "aria-invalid": Boolean(errors[name]),
            "aria-describedby": errors[name] ? `profile-${name}-error` : undefined,
            disabled: isSaving || !choices,
        };
    }

    // 사용 언어 이름: 화면 언어 목록(routeConfig)의 이름을 그대로 쓴다 (각 언어로 쓰인 이름)
    const languageLabel = (code) => languages.find((item) => item.value === code)?.label ?? code;

    return (
        <div className="page-stack">
            {/* 가운데 카드 안의 입력 폼 (한 줄에 한 항목) */}
            <form
                className={`panel ${styles.card}`}
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="profile-edit-title"
                aria-busy={!choices && !loadError}
            >
                <div className={styles.head}>
                    <h1 id="profile-edit-title" className={styles.title}>
                        {t("auth.profileEdit.title")}
                    </h1>
                    <p className={styles.description}>{t("auth.profileEdit.description")}</p>
                </div>

                {loadError && (
                    <p className="form-error" role="alert">
                        {messageText(t, loadError)}
                    </p>
                )}

                <div className={styles.fields}>
                    {/* 닉네임 */}
                    <div className="form-field">
                        <label htmlFor="profile-nickname">{t("auth.profileEdit.nickname")}</label>
                        <input
                            {...fieldProps("nickname")}
                            type="text"
                            autoComplete="nickname"
                            disabled={isSaving}
                            aria-describedby={`profile-nickname-help${errors.nickname ? " profile-nickname-error" : ""}`}
                        />
                        <p id="profile-nickname-help" className="form-help">
                            {t("auth.profileEdit.nicknameHelp")}
                        </p>
                        <FieldError
                            id="profile-nickname-error"
                            message={messageText(t, errors.nickname)}
                        />
                    </div>

                    {/* 사용 언어 (저장만 한다. 화면 언어는 헤더에서 따로 바꾼다) */}
                    <div className="form-field">
                        <label htmlFor="profile-language">{t("auth.profileEdit.language")}</label>
                        <select {...fieldProps("language")}>
                            {(choices?.languages ?? []).map((code) => (
                                <option key={code} value={code}>
                                    {languageLabel(code)}
                                </option>
                            ))}
                        </select>
                        <FieldError
                            id="profile-language-error"
                            message={messageText(t, errors.language)}
                        />
                    </div>

                    {/* 체류 유형 (모르면 비워 둔다) */}
                    <div className="form-field">
                        <label htmlFor="profile-residenceTypeCode">
                            {t("auth.profileEdit.residenceType")}{" "}
                            <span className="text-muted">{t("auth.common.optional")}</span>
                        </label>
                        <select {...fieldProps("residenceTypeCode")}>
                            <option value="">{t("auth.profileEdit.notSelected")}</option>
                            {(choices?.residenceTypes ?? []).map((item) => (
                                <option key={item.code} value={item.code}>
                                    {item.name}
                                </option>
                            ))}
                        </select>
                        <FieldError
                            id="profile-residenceTypeCode-error"
                            message={messageText(t, errors.residenceTypeCode)}
                        />
                    </div>

                    {/* 체류자격 (추천 질문과 같은 목록, 내국인이면 숨긴다) */}
                    {form.residenceTypeCode !== KOREAN && (
                        <div className="form-field">
                            <label htmlFor="profile-visaTypeCode">
                                {t("auth.profileEdit.visaType")}{" "}
                                <span className="text-muted">{t("auth.common.optional")}</span>
                            </label>
                            <select {...fieldProps("visaTypeCode")}>
                                <option value="">{t("auth.profileEdit.notSelected")}</option>
                                {(choices?.visaTypes ?? []).map((item) => (
                                    <option key={item.code} value={item.code}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            <FieldError
                                id="profile-visaTypeCode-error"
                                message={messageText(t, errors.visaTypeCode)}
                            />
                        </div>
                    )}

                    {/* 직업 (자유 입력, 모르면 비워 둔다) */}
                    <div className="form-field">
                        <label htmlFor="profile-job">
                            {t("auth.profileEdit.job")}{" "}
                            <span className="text-muted">{t("auth.common.optional")}</span>
                        </label>
                        <input {...fieldProps("job")} type="text" maxLength={50} />
                        <FieldError id="profile-job-error" message={messageText(t, errors.job)} />
                    </div>

                    {/* 로그인 아이디 (바꿀 수 없음) */}
                    <div className="form-field">
                        <label htmlFor="profile-loginId">{t("auth.profileEdit.loginId")}</label>
                        <input
                            id="profile-loginId"
                            type="text"
                            value={member?.loginId ?? ""}
                            readOnly
                            aria-readonly="true"
                        />
                    </div>
                </div>

                {formError && (
                    <p className="form-error" role="alert">
                        {messageText(t, formError)}
                    </p>
                )}

                <div className={styles.actions}>
                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={isSaving || !choices}
                    >
                        {isSaving ? t("auth.common.saving") : t("auth.common.save")}
                    </button>
                    <Link to="/mypage" className="button">
                        {t("auth.common.cancel")}
                    </Link>
                </div>
            </form>
        </div>
    );
}
