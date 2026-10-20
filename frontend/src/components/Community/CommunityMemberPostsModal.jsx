import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getCommunityMemberPosts } from "../../api/communityApi.js";
import ProfileAvatar from "../../auth/components/ProfileAvatar.jsx";
import CommunityPostModal from "./CommunityPostModal.jsx";

// 프로필 카드에서 선택한 회원이 작성한 글만 모달로 보여준다.
export default function CommunityMemberPostsModal({
    memberId,
    nickname,
    isOpen,
    onClose,
}) {
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [openedPostId, setOpenedPostId] = useState(null);

    useEffect(() => {
        if (!isOpen || !memberId) return undefined;

        let isMounted = true;

        async function loadMemberPosts() {
            setIsLoading(true);
            setError("");

            try {
                const response = await getCommunityMemberPosts(memberId);
                if (isMounted) setPosts(response);
            } catch (requestError) {
                if (isMounted) {
                    setError(requestError.message || t("community.memberPosts.error"));
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadMemberPosts();

        return () => {
            isMounted = false;
        };
    }, [isOpen, memberId, t]);

    function openPost(postId) {
        // 목록은 닫고 같은 상세 모달을 열어 페이지 이동 없이 내용을 보여준다.
        setOpenedPostId(postId);
        onClose();
    }

    return (
        <>
            {isOpen && (
                <div
                    className="community-member-posts-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) onClose();
                    }}
                >
                    <section
                        className="community-member-posts-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t("community.memberPosts.title", { nickname })}
                    >
                        <header>
                            <h3>{t("community.memberPosts.title", { nickname })}</h3>
                            <button type="button" onClick={onClose}>
                                {t("community.memberPosts.close")}
                            </button>
                        </header>

                        {isLoading && <p>{t("community.memberPosts.loading")}</p>}
                        {!isLoading && error && <p role="alert">{error}</p>}
                        {!isLoading && !error && posts.length === 0 && (
                            <p>{t("community.memberPosts.empty")}</p>
                        )}
                        {!isLoading && !error && posts.length > 0 && (
                            <ul className="community-member-post-list">
                                {posts.map((post) => (
                                    <li key={post.postId}>
                                        <button type="button" onClick={() => openPost(post.postId)}>
                                            <span className="community-member-post-list-author">
                                                <ProfileAvatar
                                                    imageUrl={post.profileImageUrl}
                                                    name={post.nickname || post.loginId}
                                                    size={32}
                                                />
                                                <span>
                                                    <strong>{post.loginId || post.nickname}</strong>
                                                    <small>
                                                        {post.createdAt
                                                            ? new Date(post.createdAt).toLocaleDateString("ko-KR")
                                                            : ""}
                                                    </small>
                                                </span>
                                            </span>
                                            <strong>
                                                {post.content?.trim() || t("community.memberPosts.imageOnly")}
                                            </strong>
                                            <span>
                                                {t("community.memberPosts.viewCount", {
                                                    count: post.viewCount ?? 0,
                                                })}
                                                {" · "}
                                                {t("community.memberPosts.commentCount", {
                                                    count: post.commentCount ?? 0,
                                                })}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            )}

            <CommunityPostModal
                postId={openedPostId}
                onClose={() => setOpenedPostId(null)}
            />
        </>
    );
}
