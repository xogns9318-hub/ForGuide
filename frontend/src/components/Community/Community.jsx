import { useEffect, useRef, useState } from "react";
import {
    createCommunityPost,
    deleteCommunityPost,
    getCommunityPostLike,
    getCommunityPostRepost,
    getCommunityPostsByCursor,
    likeCommunityPost,
    repostCommunityPost,
    unlikeCommunityPost,
    unrepostCommunityPost,
} from "../../api/communityApi.js";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import ProfileAvatar from "../../auth/components/ProfileAvatar.jsx";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "../../styles/community.css";
import CommunityCommentSection from "./CommunityCommentSection.jsx";
import CommunityMemberPreview from "./CommunityMemberPreview.jsx";
import CommunityPostEditForm from "./CommunityPostEditForm.jsx";

const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function PostCard({
    post,
    currentMemberId,
    onDelete,
    onUpdate,
    onCommentCountChange,
    isDeleting,
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [likeInfo, setLikeInfo] = useState({ likeCount: 0, likedByMe: false });
    const [isLikeLoading, setIsLikeLoading] = useState(true);
    const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);
    const [likeError, setLikeError] = useState("");
    const [repostInfo, setRepostInfo] = useState({ repostCount: 0, repostedByMe: false });
    const [isRepostLoading, setIsRepostLoading] = useState(true);
    const [isRepostSubmitting, setIsRepostSubmitting] = useState(false);
    const [repostError, setRepostError] = useState("");

    const isOwner = Number(post.memberId) === Number(currentMemberId);
    const formattedDate = post.createdAt
        ? new Date(post.createdAt).toLocaleDateString("ko-KR")
        : "";

    useEffect(() => {
        let isMounted = true;

        async function loadLikeInfo() {
            setIsLikeLoading(true);
            try {
                const response = await getCommunityPostLike(post.postId);
                if (isMounted) setLikeInfo(response);
            } catch {
                if (isMounted) setLikeError("좋아요 정보를 불러오지 못했습니다.");
            } finally {
                if (isMounted) setIsLikeLoading(false);
            }
        }

        loadLikeInfo();
        return () => {
            isMounted = false;
        };
    }, [post.postId]);

    useEffect(() => {
        let isMounted = true;

        async function loadRepostInfo() {
            setIsRepostLoading(true);
            try {
                const response = await getCommunityPostRepost(post.postId);
                if (isMounted) setRepostInfo(response);
            } catch {
                if (isMounted) setRepostError("리포스트 정보를 불러오지 못했습니다.");
            } finally {
                if (isMounted) setIsRepostLoading(false);
            }
        }

        loadRepostInfo();
        return () => {
            isMounted = false;
        };
    }, [post.postId]);

    async function handleLikeClick() {
        if (!currentMemberId) {
            setLikeError("좋아요를 누르려면 로그인이 필요합니다.");
            return;
        }

        setLikeError("");
        setIsLikeSubmitting(true);
        try {
            const response = likeInfo.likedByMe
                ? await unlikeCommunityPost(post.postId)
                : await likeCommunityPost(post.postId);
            setLikeInfo(response);
        } catch (error) {
            setLikeError(error?.message || "좋아요 처리에 실패했습니다.");
        } finally {
            setIsLikeSubmitting(false);
        }
    }

    async function handleRepostClick() {
        if (!currentMemberId) {
            setRepostError("리포스트하려면 로그인이 필요합니다.");
            return;
        }

        setRepostError("");
        setIsRepostSubmitting(true);
        try {
            const response = repostInfo.repostedByMe
                ? await unrepostCommunityPost(post.postId)
                : await repostCommunityPost(post.postId);
            setRepostInfo(response);
        } catch (error) {
            setRepostError(error?.message || "리포스트 처리에 실패했습니다.");
        } finally {
            setIsRepostSubmitting(false);
        }
    }

    function handleUpdatedPost(updatedPost) {
        onUpdate(updatedPost);
        setIsEditing(false);
    }

    return (
        <article className="community-post-card">
            <header className="community-post-header">
                <div className="community-author">
                    <CommunityMemberPreview
                        memberId={post.memberId}
                        imageUrl={post.profileImageUrl}
                        nickname={post.nickname}
                        size={38}
                    />
                    <div>
                        <strong>{post.nickname}</strong>
                        <p>{formattedDate}</p>
                    </div>
                </div>

                {isOwner && !isEditing && (
                    <div className="community-post-owner-actions">
                        <button type="button" className="community-edit-button" onClick={() => setIsEditing(true)}>
                            수정
                        </button>
                        <button
                            type="button"
                            className="community-delete-button"
                            onClick={() => onDelete(post.postId)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "삭제 중" : "삭제"}
                        </button>
                    </div>
                )}
            </header>

            {isEditing ? (
                <CommunityPostEditForm
                    post={post}
                    onCancel={() => setIsEditing(false)}
                    onUpdated={handleUpdatedPost}
                />
            ) : (
                <>
                    <p className="community-post-content">{post.content}</p>
                    {post.imageUrls?.length > 0 && (
                        <div className="community-post-images">
                            {post.imageUrls.map((imageUrl, index) => (
                                <img key={`${imageUrl}-${index}`} src={imageUrl} alt={`게시글 사진 ${index + 1}`} />
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

                        <button
                            type="button"
                            className="community-comment-toggle"
                            onClick={() => setIsCommentsOpen((value) => !value)}
                            aria-expanded={isCommentsOpen}
                        >
                            <span aria-hidden="true">▱</span>
                            {isCommentsOpen ? "댓글 닫기" : `댓글 보기 ${post.commentCount ?? 0}`}
                        </button>
                    </div>

                    {likeError && <p className="community-like-error" role="alert">{likeError}</p>}
                    {repostError && <p className="community-like-error" role="alert">{repostError}</p>}
                    {isCommentsOpen && (
                        <CommunityCommentSection
                            postId={post.postId}
                            postMemberId={post.memberId}
                            onCommentCountChange={onCommentCountChange}
                        />
                    )}
                </>
            )}
        </article>
    );
}

export default function Community() {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const { accessToken, member } = useAuthStore();
    const currentMemberId = member?.memberId;
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [writeError, setWriteError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const observerTarget = useRef(null);
    const loadingRef = useRef(false);
    const cursorCreatedAtRef = useRef(null);
    const cursorPostIdRef = useRef(null);
    const hasMoreRef = useRef(true);

    async function loadMorePosts() {
        if (loadingRef.current || !hasMoreRef.current) return;

        loadingRef.current = true;
        setIsLoading(true);
        setError("");
        try {
            const response = await getCommunityPostsByCursor({
                cursorCreatedAt: cursorCreatedAtRef.current,
                cursorPostId: cursorPostIdRef.current,
                size: 10,
            });
            const receivedPosts = Array.isArray(response) ? response : [];

            // 무한 스크롤에서 같은 게시글이 두 번 보이지 않도록 ID 기준으로 걸러낸다.
            setPosts((previous) => {
                const ids = new Set(previous.map((item) => item.postId));
                return [...previous, ...receivedPosts.filter((item) => !ids.has(item.postId))];
            });

            const lastPost = receivedPosts.at(-1);
            cursorCreatedAtRef.current = lastPost?.createdAt ?? cursorCreatedAtRef.current;
            cursorPostIdRef.current = lastPost?.postId ?? cursorPostIdRef.current;
            const nextHasMore = receivedPosts.length === 10;
            hasMoreRef.current = nextHasMore;
            setHasMore(nextHasMore);
        } catch (requestError) {
            setError(requestError?.message || "게시글을 불러오지 못했습니다.");
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadMorePosts();
    }, []);

    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMorePosts();
            },
            { rootMargin: "180px" },
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, [hasMore]);

    function handleImageChange(event) {
        const selectedImages = Array.from(event.target.files || []);
        const totalImages = images.length + selectedImages.length;

        if (totalImages > MAX_IMAGE_COUNT) {
            setWriteError(`사진은 최대 ${MAX_IMAGE_COUNT}장까지 첨부할 수 있습니다.`);
            event.target.value = "";
            return;
        }

        const invalidImage = selectedImages.find(
            (file) => !["image/jpeg", "image/png"].includes(file.type) || file.size > MAX_IMAGE_BYTES,
        );
        if (invalidImage) {
            setWriteError("JPG 또는 PNG 파일만 가능하며, 사진 한 장은 20MB 이하여야 합니다.");
            event.target.value = "";
            return;
        }

        setWriteError("");
        setImages((previous) => [...previous, ...selectedImages]);
        event.target.value = "";
    }

    function removeImage(index) {
        setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const trimmedContent = content.trim();

        if (!accessToken || !currentMemberId) {
            setWriteError("게시글을 작성하려면 로그인이 필요합니다.");
            window.setTimeout(() => navigate("/login"), 900);
            return;
        }
        if (!trimmedContent) {
            setWriteError("게시글 내용을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setWriteError("");
        try {
            const formData = new FormData();
            formData.append("content", trimmedContent);
            formData.append("language", i18n.language || "ko");
            images.forEach((image) => formData.append("images", image));
            await createCommunityPost(formData);

            setContent("");
            setImages([]);
            cursorCreatedAtRef.current = null;
            cursorPostIdRef.current = null;
            hasMoreRef.current = true;
            setHasMore(true);
            setPosts([]);
            await loadMorePosts();
        } catch (requestError) {
            setWriteError(requestError?.message || "게시글 작성에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(postId) {
        if (!window.confirm("이 게시글을 삭제할까요?")) return;

        setDeletingPostId(postId);
        setDeleteError("");
        try {
            await deleteCommunityPost(postId);
            setPosts((previous) => previous.filter((post) => post.postId !== postId));
        } catch (requestError) {
            setDeleteError(requestError?.message || "게시글 삭제에 실패했습니다.");
        } finally {
            setDeletingPostId(null);
        }
    }

    function handleUpdatePost(updatedPost) {
        setPosts((previous) => previous.map((post) => (
            post.postId === updatedPost.postId ? updatedPost : post
        )));
    }

    // 댓글 영역이 최신 댓글 수를 알려오면 해당 게시글 카드만 즉시 갱신한다.
    function handleCommentCountChange(postId, commentCount) {
        setPosts((previous) => previous.map((post) => (
            post.postId === postId ? { ...post, commentCount } : post
        )));
    }

    return (
        <div className="page-stack community-page">
            <section className="community-board panel" aria-label="커뮤니티 게시판">
                <form className="community-write-area" onSubmit={handleSubmit}>
                    <ProfileAvatar imageUrl={member?.profileImageUrl} name={member?.nickname || ""} size={44} />
                    <div className="community-write-form">
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            placeholder="한국 생활에 필요한 정보를 함께 나누고 싶어요."
                            maxLength={5000}
                            aria-label="게시글 내용"
                        />
                        <div className="community-write-toolbar">
                            <label className="community-image-picker">
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <rect x="3" y="4" width="18" height="16" rx="3" />
                                    <circle cx="9" cy="10" r="1.5" />
                                    <path d="m4.5 18 5-5 3.5 3 2.5-2.5 4 4.5" />
                                </svg>
                                사진 추가
                                <input type="file" accept="image/jpeg,image/png" multiple onChange={handleImageChange} />
                            </label>
                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "작성 중" : "작성"}
                            </button>
                        </div>
                        {images.length > 0 && (
                            <ul className="community-selected-images">
                                {images.map((image, index) => (
                                    <li key={`${image.name}-${index}`}>
                                        <span>{image.name}</span>
                                        <button type="button" onClick={() => removeImage(index)}>삭제</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {writeError && <p className="community-write-error" role="alert">{writeError}</p>}
                    </div>
                </form>

                <div className="community-post-area">
                    <div className="community-post-list">
                        {posts.map((post) => (
                            <PostCard
                                key={post.postId}
                                post={post}
                                currentMemberId={currentMemberId}
                                onDelete={handleDelete}
                                onUpdate={handleUpdatePost}
                                onCommentCountChange={handleCommentCountChange}
                                isDeleting={deletingPostId === post.postId}
                            />
                        ))}
                    </div>

                    {isLoading && <p className="community-state-message">게시글을 불러오는 중입니다.</p>}
                    {error && (
                        <div className="community-state-message" role="alert">
                            <p>{error}</p>
                            <button type="button" onClick={loadMorePosts}>다시 시도</button>
                        </div>
                    )}
                    {!isLoading && !error && posts.length === 0 && (
                        <p className="community-state-message">아직 작성된 게시글이 없습니다.</p>
                    )}
                    {deleteError && <p className="community-write-error" role="alert">{deleteError}</p>}
                    {!hasMore && posts.length > 0 && (
                        <p className="community-end-message">모든 게시글을 불러왔습니다.</p>
                    )}
                    <div ref={observerTarget} aria-hidden="true" />
                </div>

                <div className="community-notice-area">
                    <button type="button">안내 확인하기</button>
                </div>
            </section>
        </div>
    );
}
