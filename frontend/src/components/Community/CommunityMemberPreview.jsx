import { useRef, useState } from "react";
import { getCommunityMemberPreview } from "../../api/communityApi.js";
import ProfileAvatar from "../../auth/components/ProfileAvatar.jsx";

// 작성자 아바타에 마우스를 올리거나 키보드로 포커스하면 공개 프로필 요약을 보여준다.
export default function CommunityMemberPreview({
    memberId,
    imageUrl,
    nickname,
    size = 38,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const closeTimerRef = useRef(null);

    function cancelClose() {
        window.clearTimeout(closeTimerRef.current);
    }

    async function openPreview() {
        cancelClose();
        setIsOpen(true);

        if (preview || isLoading || !memberId) {
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            setPreview(await getCommunityMemberPreview(memberId));
        } catch (requestError) {
            setError(requestError.message || "프로필 정보를 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    }

    function scheduleClose() {
        closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 160);
    }

    const profile = preview ?? {
        nickname,
        profileImageUrl: imageUrl,
        postCount: 0,
        receivedLikeCount: 0,
    };

    return (
        <span
            className="community-member-preview"
            onMouseEnter={openPreview}
            onMouseLeave={scheduleClose}
            onFocus={openPreview}
            onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    scheduleClose();
                }
            }}
        >
            <button
                type="button"
                className="community-member-preview-trigger"
                aria-label={`${nickname || "회원"} 프로필 미리보기`}
                aria-expanded={isOpen}
                onClick={() => (isOpen ? setIsOpen(false) : openPreview())}
            >
                <ProfileAvatar imageUrl={imageUrl} name={nickname} size={size} />
            </button>

            {isOpen && (
                <aside className="community-member-preview-card" aria-label="프로필 미리보기">
                    <div className="community-member-preview-head">
                        <ProfileAvatar
                            imageUrl={profile.profileImageUrl}
                            name={profile.nickname}
                            size={54}
                        />
                        <strong>{profile.nickname || "이름 없는 회원"}</strong>
                    </div>

                    {isLoading ? (
                        <p className="community-member-preview-loading">프로필을 불러오는 중입니다.</p>
                    ) : error ? (
                        <p className="community-member-preview-error">{error}</p>
                    ) : (
                        <>
                            <p className="community-member-preview-intro">
                                아직 소개글을 작성하지 않았습니다.
                            </p>
                            <div className="community-member-preview-stats">
                                <span><b>{profile.postCount ?? 0}</b> 게시글</span>
                                <span><b>{profile.receivedLikeCount ?? 0}</b> 받은 공감</span>
                            </div>
                        </>
                    )}
                </aside>
            )}
        </span>
    );
}
