import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    getCommunityPost,
    getCommunityPostLike,
    getCommunityPostRepost,
    likeCommunityPost,
    repostCommunityPost,
    unlikeCommunityPost,
    unrepostCommunityPost,
} from "../../api/communityApi.js";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import CommunityCommentSection from "./CommunityCommentSection.jsx";
import CommunityMemberPreview from "./CommunityMemberPreview.jsx";

// 피드에서 게시글 본문을 누르면 상세 내용을 모달로 보여준다.
export default function CommunityPostModal({
    postId,
    onClose,
    onPostLoaded,
    onCommentCountChange,
}) {
    const { t } = useTranslation();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [likeInfo, setLikeInfo] = useState({ likeCount: 0, likedByMe: false });
    const [repostInfo, setRepostInfo] = useState({ repostCount: 0, repostedByMe: false });
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [isRepostLoading, setIsRepostLoading] = useState(false);
    const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);
    const [isRepostSubmitting, setIsRepostSubmitting] = useState(false);
    const [reactionError, setReactionError] = useState("");
    const currentMemberId = useAuthStore((state) => state.member?.memberId);

    useEffect(() => {
        if (!postId) return undefined;

        let isMounted = true;

        async function loadPost() {
            setIsLoading(true);
            setError("");
            setPost(null);

            try {
                // 상세 API를 호출하는 순간에만 서버가 조회수를 24시간 규칙으로 기록한다.
                const response = await getCommunityPost(postId);
                if (isMounted) {
                    setPost(response);
                    onPostLoaded?.(response);
                }
            } catch (requestError) {
                if (isMounted) {
                    setError(requestError.message || t("community.postModal.error"));
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        loadPost();

        return () => {
            isMounted = false;
        };
    }, [postId, onPostLoaded, t]);

    useEffect(() => {
        if (!postId) return undefined;

        let isMounted = true;

        async function loadReactions() {
            setIsLikeLoading(true);
            setIsRepostLoading(true);
            setReactionError("");

            try {
                const [nextLikeInfo, nextRepostInfo] = await Promise.all([
                    getCommunityPostLike(postId),
                    getCommunityPostRepost(postId),
                ]);
                if (isMounted) {
                    setLikeInfo(nextLikeInfo);
                    setRepostInfo(nextRepostInfo);
                }
            } catch (requestError) {
                if (isMounted) {
                    setReactionError(requestError.message || "리액션 정보를 불러오지 못했습니다.");
                }
            } finally {
                if (isMounted) {
                    setIsLikeLoading(false);
                    setIsRepostLoading(false);
                }
            }
        }

        loadReactions();

        return () => {
            isMounted = false;
        };
    }, [postId]);

    useEffect(() => {
        if (!postId) return undefined;

        function handleKeyDown(event) {
            if (event.key === "Escape") onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [postId, onClose]);

    function handleModalCommentCountChange(changedPostId, commentCount) {
        setPost((previous) => (
            previous && Number(previous.postId) === Number(changedPostId)
                ? { ...previous, commentCount }
                : previous
        ));
        onCommentCountChange?.(changedPostId, commentCount);
    }

    async function handleLikeClick() {
        if (!currentMemberId) {
            setReactionError("공감을 누르려면 로그인이 필요합니다.");
            return;
        }

        setIsLikeSubmitting(true);
        setReactionError("");
        try {
            const response = likeInfo.likedByMe
                ? await unlikeCommunityPost(postId)
                : await likeCommunityPost(postId);
            setLikeInfo(response);
        } catch (requestError) {
            setReactionError(requestError.message || "공감 처리에 실패했습니다.");
        } finally {
            setIsLikeSubmitting(false);
        }
    }

    async function handleRepostClick() {
        if (!currentMemberId) {
            setReactionError("리포스트하려면 로그인이 필요합니다.");
            return;
        }

        setIsRepostSubmitting(true);
        setReactionError("");
        try {
            const response = repostInfo.repostedByMe
                ? await unrepostCommunityPost(postId)
                : await repostCommunityPost(postId);
            setRepostInfo(response);
        } catch (requestError) {
            setReactionError(requestError.message || "리포스트 처리에 실패했습니다.");
        } finally {
            setIsRepostSubmitting(false);
        }
    }

    if (!postId) return null;

    const formattedDate = post?.createdAt
        ? new Date(post.createdAt).toLocaleDateString("ko-KR")
        : "";

    return (
        <div
            className="community-post-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                className="community-post-modal"
                role="dialog"
                aria-modal="true"
                aria-label={t("community.postModal.title")}
            >
                <header className="community-post-modal-header">
                    <h3>{t("community.postModal.title")}</h3>
                    <button type="button" onClick={onClose}>
                        {t("community.postModal.close")}
                    </button>
                </header>

                {isLoading && <p>{t("community.postModal.loading")}</p>}
                {!isLoading && error && <p role="alert">{error}</p>}
                {!isLoading && post && (
                    <article className="community-post-modal-content">
                        <header className="community-post-header community-post-modal-author">
                            <div className="community-author">
                                <CommunityMemberPreview
                                    memberId={post.memberId}
                                    imageUrl={post.profileImageUrl}
                                    nickname={post.nickname}
                                    loginId={post.loginId}
                                    size={42}
                                />
                                <div>
                                    <strong>{post.loginId}</strong>
                                    <p>{formattedDate}</p>
                                </div>
                            </div>
                        </header>

                        <p className="community-post-content">{post.content}</p>
                        {post.images?.length > 0 && (
                            <div className="community-post-images">
                                {post.images.map((image, index) => (
                                    <img
                                        key={image.imageId ?? `${image.imageUrl}-${index}`}
                                        src={image.imageUrl}
                                        alt={`게시글 사진 ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="community-post-actions">
                            <button
                                type="button"
                                className="community-like-button"
                                onClick={handleLikeClick}
                                disabled={isLikeLoading || isLikeSubmitting}
                                aria-pressed={likeInfo.likedByMe}
                            >
                                <span aria-hidden="true">♡</span>
                                {likeInfo.likedByMe ? "공감 취소" : "공감"}
                                <strong>{likeInfo.likeCount}</strong>
                            </button>
                            <button
                                type="button"
                                className="community-repost-button"
                                onClick={handleRepostClick}
                                disabled={isRepostLoading || isRepostSubmitting}
                                aria-pressed={repostInfo.repostedByMe}
                            >
                                <span aria-hidden="true">↻</span>
                                {repostInfo.repostedByMe ? "리포스트 취소" : "리포스트"}
                                <strong>{repostInfo.repostCount}</strong>
                            </button>
                            <span className="community-view-count">
                                <svg className="community-view-icon" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                                    <circle cx="12" cy="12" r="2.5" />
                                </svg>
                                {t("community.postModal.viewCount")} <strong>{post.viewCount ?? 0}</strong>
                            </span>
                            <span className="community-view-count">
                                <span aria-hidden="true">▱</span>
                                {t("community.postModal.commentCount")} <strong>{post.commentCount ?? 0}</strong>
                            </span>
                        </div>

                        {reactionError && <p className="community-like-error" role="alert">{reactionError}</p>}

                        <CommunityCommentSection
                            postId={post.postId}
                            postMemberId={post.memberId}
                            onCommentCountChange={handleModalCommentCountChange}
                        />
                    </article>
                )}
            </section>
        </div>
    );
}
