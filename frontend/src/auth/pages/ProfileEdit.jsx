import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Banner from "../../components/Banner/Banner.jsx";
import FieldError from "../../components/FieldError/FieldError.jsx";
import { updateNickname } from "../api/memberApi.js";
import { messageText, apiErrorMessage, apiFieldErrors } from "../utils/authMessages.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { validateNickname } from "../utils/authValidation.js";
import "../auth.css";

// 프로필 수정 (Figma: 프로필 수정 · 기본 정보, /mypage/edit) — 지금은 닉네임만 수정
// RequireAuth 안에서만 열리므로 로그인한 회원 정보가 있다
export default function ProfileEdit() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const member = useAuthStore((state) => state.member);

    // 처음 값은 현재 닉네임 (없으면 빈칸)
    const [nickname, setNickname] = useState(member?.nickname ?? "");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const inputRef = useRef(null);
    const mounted = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        if (isSaving) return;

        const message = validateNickname(nickname);
        if (message) {
            setError(message);
            inputRef.current?.focus();
            return;
        }

        setIsSaving(true);
        setError("");

        try {
            // 성공하면 memberApi가 스토어의 회원 정보를 갱신한다 (마이페이지에 바로 반영)
            await updateNickname(nickname);
            if (!mounted.current) return;

            // 다음 행동: 마이페이지로 돌아간다
            navigate("/mypage", { replace: true });
        } catch (saveError) {
            if (!mounted.current) return;

            setError(
                apiFieldErrors(saveError).nickname ??
                    apiErrorMessage(saveError, "auth.profileEdit.saveFailed"),
            );
            inputRef.current?.focus();
        } finally {
            if (mounted.current) setIsSaving(false);
        }
    }

    return (
        <div className="page-stack">
            <Banner
                title={t("auth.profileEdit.title")}
                description={t("auth.profileEdit.description")}
            />

            <form
                className="panel"
                onSubmit={handleSubmit}
                noValidate
                aria-labelledby="profile-edit-title"
            >
                <div className="auth-panel-head panel-title">
                    <h2 id="profile-edit-title">{t("auth.profileEdit.heading")}</h2>
                </div>

                <div className="form-grid">
                    {/* 닉네임 */}
                    <div className="form-field">
                        <label htmlFor="profile-nickname">{t("auth.profileEdit.nickname")}</label>
                        <input
                            ref={inputRef}
                            id="profile-nickname"
                            type="text"
                            value={nickname}
                            onChange={(event) => {
                                setNickname(event.target.value);
                                setError("");
                            }}
                            readOnly={isSaving}
                            autoComplete="nickname"
                            aria-invalid={Boolean(error)}
                            aria-describedby={`profile-nickname-help${error ? " profile-nickname-error" : ""}`}
                        />
                        <p id="profile-nickname-help" className="form-help">
                            {t("auth.profileEdit.nicknameHelp")}
                        </p>
                        <FieldError id="profile-nickname-error" message={messageText(t, error)} />
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

                <div className="form-actions">
                    <button type="submit" className="button button-primary" disabled={isSaving}>
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
