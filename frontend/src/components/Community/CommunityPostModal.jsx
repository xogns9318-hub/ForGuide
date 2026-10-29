import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    deleteCommunityPost,
    getCommunityPost,
    getCommunityPostLike,
    getCommunityPostRepost,
    likeCommunityPost,
    repostCommunityPost,
    translateCommunityPost,
    unlikeCommunityPost,
    unrepostCommunityPost,
} from "../../api/communityApi.js";
import { confirm } from "../Modal/modal.js";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import CommunityCommentSection from "./CommunityCommentSection.jsx";
import CommunityPostEditForm from "./CommunityPostEditForm.jsx";
import CommunityMemberPreview from "./CommunityMemberPreview.jsx";

// relatedService는 사용자가 쓴 본문이 아니라 서비스 식별값이므로 LLM 대신 i18next로 표시한다.
const RELATED_SERVICE_LINKS = {
    ACCOUNT_RECOMMEND: {
        labelKey: "community.relatedServices.account",
        path: "/service/account",
    },
    LOAN_RECOMMEND: {
        labelKey: "community.relatedServices.loan",
        path: "/service/loan",
    },
    INSURANCE_RECOMMEND: {
        labelKey: "community.relatedServices.insurance",
        path: "/service/insurance",
    },
    EMPLOYMENT_GUIDE: {
        labelKey: "community.relatedServices.employment",
        path: "/service/jobListings",
    },
};

// 피드에서 게시글 본문을 누르면 상세 내용을 모달로 보여준다.
export default function CommunityPostModal({
    postId,
    onClose,
    onPostLoaded,
    onCommentCountChange,
    onPostDeleted,
}) {
    const { t, i18n } = useTranslation();
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
    const targetLanguage = i18n.resolvedLanguage || i18n.language || "ko";
    const [translatedText, setTranslatedText] = useState("");
    const [isTranslationVisible, setIsTranslationVisible] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationError, setTranslationError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [ownerActionError, setOwnerActionError] = useState("");

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
                    setReactionError(
                        requestError.message || t("community.postModal.reactionLoadError"),
                    );
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
    }, [postId, t]);

    useEffect(() => {
        if (!postId) return undefined;

        function handleKeyDown(event) {
            if (event.key === "Escape") onClose();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [postId, onClose]);

    // 다른 게시글을 열거나 사이트 언어를 바꾸면 이전 번역 결과를 초기화
    useEffect(() => {
        setTranslatedText("");
        setIsTranslationVisible(false);
        setIsTranslating(false);
        setTranslationError("");
    }, [postId, targetLanguage]);

    async function handleTranslationClick() {
        // 이미 열린 번역은 API를 다시 호출하지 않고 접기만 한다.
        if (isTranslationVisible) {
            setIsTranslationVisible(false);
            return;
        }

        // 같은 게시글·언어 조합을 다시 열 때는 화면 상태에 둔 결과를 재사용한다.
        if (translatedText) {
            setIsTranslationVisible(true);
            return;
        }

        setIsTranslating(true);
        setTranslationError("");

        try {
            const response = await translateCommunityPost(postId, targetLanguage);

            setTranslatedText(response.translatedText);
            setIsTranslationVisible(true);
        } catch (requestError) {
            setTranslationError(requestError.message || t("community.postModal.translationError"));
        } finally {
            setIsTranslating(false);
        }
    }

    function handleModalCommentCountChange(changedPostId, commentCount) {
        setPost((previous) =>
            previous && Number(previous.postId) === Number(changedPostId)
                ? { ...previous, commentCount }
                : previous,
        );
        onCommentCountChange?.(changedPostId, commentCount);
    }

    // 상세 모달에서 수정한 결과도 부모 목록과 같은 최신 데이터로 교체한다.
    function handlePostUpdated(updatedPost) {
        setPost(updatedPost);
        setIsEditing(false);
        onPostLoaded?.(updatedPost);
    }

    async function handlePostDelete() {
        if (!(await confirm(t("community.feedback.deleteConfirm")))) return;

        setIsDeleting(true);
        setOwnerActionError("");

        try {
            await deleteCommunityPost(post.postId);
            onPostDeleted?.(post.postId);
            onClose();
        } catch (requestError) {
            setOwnerActionError(requestError.message || t("community.feedback.deleteFailed"));
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleLikeClick() {
        if (!currentMemberId) {
            setReactionError(t("community.postModal.likeLoginRequired"));
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
            setReactionError(requestError.message || t("community.postModal.likeActionError"));
        } finally {
            setIsLikeSubmitting(false);
        }
    }

    async function handleRepostClick() {
        if (!currentMemberId) {
            setReactionError(t("community.postModal.repostLoginRequired"));
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
            setReactionError(requestError.message || t("community.postModal.repostActionError"));
        } finally {
            setIsRepostSubmitting(false);
        }
    }

    if (!postId) return null;

    const formattedDate = post?.createdAt
        ? new Date(post.createdAt).toLocaleDateString("ko-KR")
        : "";
    const relatedServiceLink = post ? RELATED_SERVICE_LINKS[post.relatedService] : null;
    const isOwner = post && Number(post.memberId) === Number(currentMemberId);

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
                                {relatedServiceLink && (
                                    <a
                                        className="community-related-service-link"
                                        href={relatedServiceLink.path}
                                    >
                                        {t(relatedServiceLink.labelKey)}
                                    </a>
                                )}
                            </div>
                            {isOwner && !isEditing && (
                                <div className="community-post-owner-actions">
                                    <button
                                        type="button"
                                        className="community-edit-button"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        {t("community.post.edit")}
                                    </button>
                                    <button
                                        type="button"
                                        className="community-delete-button"
                                        onClick={handlePostDelete}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting
                                            ? t("community.post.deleting")
                                            : t("community.post.delete")}
                                    </button>
                                </div>
                            )}
                        </header>

                        {isEditing ? (
                            <CommunityPostEditForm
                                post={post}
                                onCancel={() => setIsEditing(false)}
                                onUpdated={handlePostUpdated}
                            />
                        ) : (
                            <p className="community-post-content">{post.content}</p>
                        )}
                        {!isEditing && post.language !== targetLanguage && (
                            <section className="community-post-translation">
                                <button
                                    type="button"
                                    className="community-translation-toggle"
                                    onClick={handleTranslationClick}
                                    disabled={isTranslating}
                                >
                                    {isTranslating
                                        ? t("community.postModal.translating")
                                        : isTranslationVisible
                                          ? t("community.postModal.hideTranslation")
                                          : t("community.postModal.showTranslation")}
                                </button>

                                {translationError && (
                                    <p className="community-translation-error" role="alert">
                                        {translationError}
                                    </p>
                                )}

                                {isTranslationVisible && translatedText && (
                                    <div className="community-translation-result">
                                        <p className="community-translation-label">
                                            {t("community.postModal.aiTranslation")}
                                        </p>
                                        <p className="community-translation-text">
                                            {translatedText}
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}
                        {!isEditing && post.images?.length > 0 && (
                            <div className="community-post-images">
                                {post.images.map((image, index) => (
                                    <img
                                        key={image.imageId ?? `${image.imageUrl}-${index}`}
                                        src={image.imageUrl}
                                        alt={t("community.postModal.imageAlt", {
                                            index: index + 1,
                                        })}
                                    />
                                ))}
                            </div>
                        )}

                        {!isEditing && (
                            <div className="community-post-actions">
                                <button
                                    type="button"
                                    className="community-like-button"
                                    onClick={handleLikeClick}
                                    disabled={isLikeLoading || isLikeSubmitting}
                                    aria-pressed={likeInfo.likedByMe}
                                >
                                    <span aria-hidden="true">♡</span>
                                    {likeInfo.likedByMe
                                        ? t("community.postModal.unlike")
                                        : t("community.postModal.like")}
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
                                    {repostInfo.repostedByMe
                                        ? t("community.postModal.unrepost")
                                        : t("community.postModal.repost")}
                                    <strong>{repostInfo.repostCount}</strong>
                                </button>
                                <span className="community-view-count">
                                    <svg
                                        className="community-view-icon"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                                        <circle cx="12" cy="12" r="2.5" />
                                    </svg>
                                    {t("community.postModal.viewCount")}{" "}
                                    <strong>{post.viewCount ?? 0}</strong>
                                </span>
                                <span className="community-view-count">
                                    <span aria-hidden="true">▱</span>
                                    {t("community.postModal.commentCount")}{" "}
                                    <strong>{post.commentCount ?? 0}</strong>
                                </span>
                            </div>
                        )}

                        {!isEditing && reactionError && (
                            <p className="community-like-error" role="alert">
                                {reactionError}
                            </p>
                        )}

                        {!isEditing && (
                            <CommunityCommentSection
                                postId={post.postId}
                                postMemberId={post.memberId}
                                onCommentCountChange={handleModalCommentCountChange}
                            />
                        )}

                        {ownerActionError && (
                            <p className="community-like-error" role="alert">
                                {ownerActionError}
                            </p>
                        )}
                    </article>
                )}
            </section>
        </div>
    );
}
