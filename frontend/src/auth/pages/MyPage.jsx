import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Banner from "../../components/Banner/Banner.jsx";
import ExampleBadge from "../../components/ExampleBadge/ExampleBadge.jsx";
import FieldError from "../../components/FieldError/FieldError.jsx";
import ProfileAvatar from "../components/ProfileAvatar.jsx";
import { updateProfileImage } from "../api/memberApi.js";
import { ApiError } from "../api/apiError.js";
import { useAuthStore } from "../store/useAuthStore.js";
import {
    PROFILE_IMAGE_ACCEPT,
    PROFILE_IMAGE_HELP,
    prepareProfileImage,
    validateProfileImage,
} from "../utils/profileImage.js";
import "../auth.css";

// 마이페이지 (Figma: /mypage) — 지금은 프로필 이미지 설정만 제공
// RequireAuth 안에서만 열리므로 로그인한 회원 정보가 있다
export default function MyPage() {
    const member = useAuthStore((state) => state.member);

    // 고른 파일과 미리보기 주소 (저장 전까지는 화면에서만 보인다)
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef(null);
    const mounted = useRef(false);

    // 파일을 연달아 고를 때, 늦게 끝난 이전 파일 검사 결과가 새 선택을 덮지 않게 순번을 매긴다
    const selectSeq = useRef(0);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    // 미리보기 주소는 바뀌거나 화면을 떠날 때 메모리에서 해제한다
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // 선택을 처음 상태로 되돌린다 (같은 파일을 다시 골라도 변경 이벤트가 오도록 입력값도 비운다)
    function resetSelection() {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    // 파일 선택: 규칙 검사를 통과한 파일만 미리보기로 보여 준다
    async function handleFileChange(event) {
        const file = event.target.files?.[0];
        const seq = ++selectSeq.current;
        setError("");
        setMessage("");

        if (!file) {
            resetSelection();
            return;
        }

        const problem = await validateProfileImage(file);
        if (!mounted.current || seq !== selectSeq.current) return;

        if (problem) {
            resetSelection();
            setError(problem);
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    // 저장: 업로드 준비(나중에 JPG 변환 등) → 서버 전송 → 스토어 회원 정보 갱신
    async function handleSave(event) {
        event.preventDefault();
        if (!selectedFile || isSaving) return;

        setIsSaving(true);
        setError("");
        setMessage("");

        try {
            const uploadFile = await prepareProfileImage(selectedFile);
            await updateProfileImage(uploadFile);
            if (!mounted.current) return;

            resetSelection();
            setMessage("프로필 이미지를 저장했습니다.");
        } catch (saveError) {
            if (!mounted.current) return;

            setError(
                saveError instanceof ApiError
                    ? saveError.fieldErrors.image ?? saveError.message
                    : "프로필 이미지를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
            );
        } finally {
            if (mounted.current) setIsSaving(false);
        }
    }

    // 화면에 보일 이름: 닉네임이 있으면 닉네임, 없으면 아이디
    const displayName = member?.nickname || member?.loginId || "";

    return (
        <div className="page-stack">
            <Banner title="마이페이지" description="프로필과 내 정보를 관리하세요." />

            <form className="panel" onSubmit={handleSave} aria-labelledby="mypage-image-title">
                <div className="auth-panel-head panel-title">
                    <h2 id="mypage-image-title">프로필 이미지</h2>
                    <ExampleBadge />
                </div>

                <div className="mypage-image-row">
                    {/* 저장 전에는 고른 이미지를, 아니면 현재 이미지를 보여 준다 */}
                    <ProfileAvatar
                        imageUrl={previewUrl ?? member?.profileImageUrl}
                        name={displayName}
                        size={96}
                    />

                    <div className="form-field">
                        <label htmlFor="mypage-image">이미지 선택</label>
                        <input
                            ref={fileInputRef}
                            id="mypage-image"
                            type="file"
                            accept={PROFILE_IMAGE_ACCEPT}
                            onChange={handleFileChange}
                            disabled={isSaving}
                            aria-invalid={Boolean(error)}
                            aria-describedby={`mypage-image-help${error ? " mypage-image-error" : ""}`}
                        />
                        <p id="mypage-image-help" className="form-help">
                            {PROFILE_IMAGE_HELP}
                        </p>
                        <FieldError id="mypage-image-error" message={error} />
                        {message && (
                            <p className="auth-field-ok" role="status">
                                {message}
                            </p>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={!selectedFile || isSaving}
                    >
                        {isSaving ? "저장 중…" : "저장"}
                    </button>
                    {selectedFile && (
                        <button
                            type="button"
                            className="button"
                            onClick={resetSelection}
                            disabled={isSaving}
                        >
                            취소
                        </button>
                    )}
                    <Link to="/mypage/edit" className="button">
                        프로필 수정
                    </Link>
                </div>
            </form>
        </div>
    );
}
