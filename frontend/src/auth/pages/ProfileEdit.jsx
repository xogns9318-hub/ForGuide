import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Banner from "../../components/Banner/Banner.jsx";
import ExampleBadge from "../../components/ExampleBadge/ExampleBadge.jsx";
import FieldError from "../../components/FieldError/FieldError.jsx";
import { updateNickname } from "../api/memberApi.js";
import { ApiError } from "../../api/apiError.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { validateNickname } from "../utils/authValidation.js";
import "../auth.css";

// 프로필 수정 (Figma: 프로필 수정 · 기본 정보, /mypage/edit) — 지금은 닉네임만 수정
// RequireAuth 안에서만 열리므로 로그인한 회원 정보가 있다
export default function ProfileEdit() {
    const navigate = useNavigate();
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
                saveError instanceof ApiError
                    ? saveError.fieldErrors.nickname ?? saveError.message
                    : "닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
            );
            inputRef.current?.focus();
        } finally {
            if (mounted.current) setIsSaving(false);
        }
    }

    return (
        <div className="page-stack">
            <Banner title="프로필 수정" description="사용할 닉네임을 정하세요." />

            <form className="panel" onSubmit={handleSubmit} noValidate aria-labelledby="profile-edit-title">
                <div className="auth-panel-head panel-title">
                    <h2 id="profile-edit-title">기본 정보</h2>
                    <ExampleBadge />
                </div>

                <div className="form-grid">
                    {/* 닉네임 */}
                    <div className="form-field">
                        <label htmlFor="profile-nickname">닉네임</label>
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
                            2~20자, 여러 언어의 글자·숫자·기호를 쓸 수 있습니다.
                        </p>
                        <FieldError id="profile-nickname-error" message={error} />
                    </div>

                    {/* 로그인 아이디 (바꿀 수 없음) */}
                    <div className="form-field">
                        <label htmlFor="profile-loginId">로그인 아이디</label>
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
                        {isSaving ? "저장 중…" : "저장"}
                    </button>
                    <Link to="/mypage" className="button">
                        취소
                    </Link>
                </div>
            </form>
        </div>
    );
}
