import { useRef, useState } from "react";
import { getCommunityMemberPreview } from "../../api/communityApi.js";
import ProfileAvatar from "../../auth/components/ProfileAvatar.jsx";
import { useTranslation } from "react-i18next";
import CommunityMemberPostsModal from "./CommunityMemberPostsModal.jsx";

// 작성자 아바타에 마우스를 올리거나 키보드로 포커스하면 공개 프로필 요약을 보여준다.
export default function CommunityMemberPreview({
    memberId,
    imageUrl,
    nickname,
    size = 38,
}) {
    const { t } = useTranslation();
    const unnamedMember = t("community.memberPreview.unnamedMember");
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isMemberPostsOpen, setIsMemberPostsOpen] = useState(false);
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
            setError(requestError.message || t("community.memberPreview.error"),
                );
        } finally {
            setIsLoading(false);
        }
    }

    function scheduleClose() {
        closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 160);
    }

    function openMemberPosts() {
        cancelClose();
        setIsMemberPostsOpen(true);
    }

    const profile = preview ?? {
        nickname,
        profileImageUrl: imageUrl,
        postCount: 0,
        receivedLikeCount: 0,
    };

    return (
        <div
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
                aria-label={t("community.memberPreview.triggerAria", {
                    nickname: nickname || unnamedMember,
                })}
                aria-expanded={isOpen}
                onClick={() => (isOpen ? setIsOpen(false) : openPreview())}
            >
                <ProfileAvatar imageUrl={imageUrl} name={nickname} size={size} />
            </button>

            {isOpen && (
                <aside className="community-member-preview-card" aria-label={t("community.memberPreview.cardAria")}>
                    <div className="community-member-preview-head">
                        <ProfileAvatar
                            imageUrl={profile.profileImageUrl}
                            name={profile.nickname}
                            size={54}
                        />
                        <strong>{profile.nickname || unnamedMember}</strong>
                    </div>

                    {isLoading ? (
                        <p className="community-member-preview-loading">{t("community.memberPreview.loading")}</p>
                    ) : error ? (
                        <p className="community-member-preview-error">{error}</p>
                    ) : (
                        <>
                            <p className="community-member-preview-intro">
                                {t("community.memberPreview.defaultIntro")}
                            </p>
                            <div className="community-member-preview-stats">
                                <button
                                    type="button"
                                    className="community-member-post-count"
                                    onClick={openMemberPosts}
                                    aria-label={t("community.memberPreview.postsButtonAria", {
                                        nickname: profile.nickname || unnamedMember,
                                        count: profile.postCount ?? 0,
                                    })}
                                >
                                    <b>{profile.postCount ?? 0}</b>
                                    {" "}
                                    {t("community.memberPreview.postCount")}
                                </button>
                                <span>
                                    <b>{profile.receivedLikeCount ?? 0}</b>
                                    {" "}
                                    {t("community.memberPreview.receivedLikes")}
                                </span>
                            </div>
                        </>
                    )}
                </aside>
            )}

            <CommunityMemberPostsModal
                memberId={memberId}
                nickname={profile.nickname || unnamedMember}
                isOpen={isMemberPostsOpen}
                onClose={() => setIsMemberPostsOpen(false)}
            />
        </div>
    );
}
