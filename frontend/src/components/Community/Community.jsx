import { useCallback, useEffect, useRef, useState } from "react";
import {
    createCommunityPost,
    deleteCommunityPost,
    getCommunityPostLike,
    getCommunityPostRepost,
    getMyRepostedCommunityPosts,
    getCommunityPostsByCursor,
    getPopularCommunityPosts,
    likeCommunityPost,
    repostCommunityPost,
    unlikeCommunityPost,
    unrepostCommunityPost,
} from "../../api/communityApi.js";
import { confirm } from "../Modal/modal.js";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import ProfileAvatar from "../../auth/components/ProfileAvatar.jsx";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import "../../styles/community.css";
import CommunityCommentSection from "./CommunityCommentSection.jsx";
import CommunityMemberPreview from "./CommunityMemberPreview.jsx";
import CommunityPostEditForm from "./CommunityPostEditForm.jsx";
import CommunityPostModal from "./CommunityPostModal.jsx";


const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

// 현재는 화면 탐색을 위한 UI만 제공한다. 실제 카테고리 필터는 데이터 구조가 확정된 뒤 연결한다.
const COMMUNITY_NAVIGATION_ITEMS = [
    { icon: "▤", label: "전체 게시글", value:"" },
    { icon: "◌", label: "질문·답변", value: "QUESTION_ANSWER" },
    { icon: "☆", label: "후기·추천", value: "REVIEW_RECOMMEND" },
    { icon: "◫", label: "자유 이야기", value: "FREE_TALK" },
];

const COMMUNITY_TOPIC_ITEMS = [
    { icon: "⌂", label: "계좌 개설", value: "ACCOUNT" },
    { icon: "◉", label: "대출", value: "LOAN" },
    { icon: "◇", label: "보험", value: "INSURANCE" },
    { icon: "▣", label: "비자·체류", value: "VISA_STAY" },
    { icon: "◌", label: "한국 생활 팁", value: "LIFE_TIP" },
];

function getPostPreview(post) {
    const preview = post.content?.replace(/\s+/g, " ").trim();
    return preview || "사진이 포함된 게시글";
}

function PostCard({
    post,
    currentMemberId,
    onDelete,
    onUpdate,
    onCommentCountChange,
    onRepostChanged,
    onPopularityChanged,
    isRepostFeed,
    isDeleting,
    onOpenPost,
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
    }, [post.postId, currentMemberId]);

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
    }, [post.postId, currentMemberId]);

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
            onPopularityChanged?.();
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
            onRepostChanged?.(post.postId, response);
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
            {isRepostFeed && (
                <p className="community-repost-context">
                    <span aria-hidden="true">↻</span> 내가 리포스트함
                </p>
            )}
            <header className="community-post-header">
                <div className="community-author">
                    <CommunityMemberPreview
                        memberId={post.memberId}
                        imageUrl={post.profileImageUrl}
                        nickname={post.nickname}
                        loginId={post.loginId}
                        size={38}
                    />
                    <div>
                        <strong>{post.loginId}</strong>
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
                    <div
                        className="community-post-open-area"
                        role="button"
                        tabIndex={0}
                        aria-label="게시글 상세 보기"
                        onClick={() => onOpenPost(post.postId)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onOpenPost(post.postId);
                            }
                        }}
                    >
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
                    </div>

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

                        <span
                            className="community-view-count"
                            aria-label={`조회 ${post.viewCount ?? 0}회`}
                        >
                            <svg
                                className="community-view-icon"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                                <circle cx="12" cy="12" r="2.5" />
                            </svg>
                            조회 <strong>{post.viewCount ?? 0}</strong>
                        </span>

                        <button
                            type="button"
                            className="community-comment-toggle"
                            onClick={() => setIsCommentsOpen((value) => !value)}
                            aria-expanded={isCommentsOpen}
                        >
                            <span aria-hidden="true">▱</span>
                            {isCommentsOpen ? "댓글 닫기" : "댓글"}
                            {!isCommentsOpen && <strong>{post.commentCount ?? 0}</strong>}
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
    const [popularPosts, setPopularPosts] = useState([]);
    const [popularError, setPopularError] = useState("");
    const [popularSort, setPopularSort] = useState("likes");
    const [feedType, setFeedType] = useState("all");
    const [postCategory, setPostCategory] = useState("FREE_TALK");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [hasMore, setHasMore] = useState(true);
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [writeError, setWriteError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingPostId, setDeletingPostId] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const [openedPostId, setOpenedPostId] = useState(null);
    const observerTarget = useRef(null);
    const loadingRef = useRef(false);
    const cursorCreatedAtRef = useRef(null);
    const cursorPostIdRef = useRef(null);
    const hasMoreRef = useRef(true);
    const previewUrlsRef = useRef(new Set());

    useEffect(() => () => {
        // 화면을 떠날 때 선택 사진의 브라우저 임시 주소를 정리한다.
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    // 오른쪽 인기 게시글은 전체 글을 기준으로 공감순 또는 조회순을 서버에서 정렬해 가져온다.
    const loadPopularPosts = useCallback(async () => {
        try {
            const response = await getPopularCommunityPosts(popularSort);
            setPopularPosts(Array.isArray(response) ? response : []);
            setPopularError("");
        } catch (requestError) {
            setPopularError(
                requestError?.message || "인기 게시글을 불러오지 못했습니다.",
            );
        }
    }, [popularSort]);

    useEffect(() => {
        loadPopularPosts();
    }, [loadPopularPosts]);

    async function loadMorePosts() {
        if (loadingRef.current || !hasMoreRef.current) return;

        loadingRef.current = true;
        setIsLoading(true);
        setError("");
        try {
            if (feedType === "reposts" && !currentMemberId) {
                setPosts([]);
                hasMoreRef.current = false;
                setHasMore(false);
                setError("내 리포스트는 로그인 후 확인할 수 있습니다.");
                return;
            }

            const response = feedType === "reposts"
                ? await getMyRepostedCommunityPosts()
                : await getCommunityPostsByCursor({
                    cursorCreatedAt: cursorCreatedAtRef.current,
                    cursorPostId: cursorPostIdRef.current,
                    category: selectedCategory || null,
                    topic: selectedTopic || null,
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
            // 내 리포스트는 한 번에 전부 가져오므로 추가 스크롤 요청을 하지 않는다.
            const nextHasMore = feedType === "all" && receivedPosts.length === 10;
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
        cursorCreatedAtRef.current = null;
        cursorPostIdRef.current = null;
        hasMoreRef.current = true;
        setHasMore(true);
        setPosts([]);
        loadMorePosts();
    }, [feedType, selectedCategory, selectedTopic]);

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
    }, [hasMore, feedType, selectedCategory, selectedTopic]);

    function handleImageChange(event) {
        if (!accessToken || !currentMemberId) {
            event.target.value = "";
            navigate("/login");
            return;
        }

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
        const previews = selectedImages.map((image) => {
            const url = URL.createObjectURL(image);
            previewUrlsRef.current.add(url);
            return { url, name: image.name };
        });
        setImagePreviews((previous) => [...previous, ...previews]);
        event.target.value = "";
    }

    function removeImage(index) {
        setImages((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
        const preview = imagePreviews[index];
        if (preview) {
            URL.revokeObjectURL(preview.url);
            previewUrlsRef.current.delete(preview.url);
        }
        setImagePreviews((previous) => previous.filter((_, imageIndex) => imageIndex !== index));
    }

    function clearSelectedImages() {
        previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        previewUrlsRef.current.clear();
        setImages([]);
        setImagePreviews([]);
    }

    // 비회원은 입력을 시작하거나 사진을 고르는 순간 로그인 화면으로 안내한다.
    function handleWriteAttempt(event) {
        if (accessToken && currentMemberId) return;

        event?.preventDefault();
        navigate("/login");
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const trimmedContent = content.trim();

        if (!accessToken || !currentMemberId) {
            setWriteError("게시글을 작성하려면 로그인이 필요합니다.");
            window.setTimeout(() => navigate("/login"), 900);
            return;
        }
        // 글 또는 사진 중 하나는 있어야 게시글을 작성할 수 있다.
        if (!trimmedContent && images.length === 0) {
            setWriteError("게시글 내용 또는 사진을 추가해주세요.");
            return;
        }

        setIsSubmitting(true);
        setWriteError("");
        try {
            const formData = new FormData();
            formData.append("content", trimmedContent);
            formData.append("category", postCategory);
            formData.append("language", i18n.language || "ko");
            images.forEach((image) => formData.append("images", image));
            await createCommunityPost(formData);

            setContent("");
            clearSelectedImages();
            cursorCreatedAtRef.current = null;
            cursorPostIdRef.current = null;
            hasMoreRef.current = true;
            setHasMore(true);
            setPosts([]);
            await loadMorePosts();
            await loadPopularPosts();
        } catch (requestError) {
            setWriteError(requestError?.message || "게시글 작성에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(postId) {
        if (!(await confirm("이 게시글을 삭제할까요?"))) return;

        setDeletingPostId(postId);
        setDeleteError("");
        try {
            await deleteCommunityPost(postId);
            setPosts((previous) => previous.filter((post) => post.postId !== postId));
            await loadPopularPosts();
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

    // 상세 모달 API가 돌려준 최신 조회수·댓글 수를 피드에도 바로 반영한다.
    const handlePostOpened = useCallback((updatedPost) => {
        setPosts((previous) => previous.map((post) => (
            post.postId === updatedPost.postId ? updatedPost : post
        )));
        loadPopularPosts();
    }, [loadPopularPosts]);

    // 댓글 영역이 최신 댓글 수를 알려오면 해당 게시글 카드만 즉시 갱신한다.
    function handleCommentCountChange(postId, commentCount) {
        setPosts((previous) => previous.map((post) => (
            post.postId === postId ? { ...post, commentCount } : post
        )));
    }

    // 리포스트 탭에서 취소하면 해당 카드가 내 목록에서 즉시 사라진다.
    function handleRepostChanged(postId, repostStatus) {
        if (feedType === "reposts" && !repostStatus.repostedByMe) {
            setPosts((previous) => previous.filter((post) => post.postId !== postId));
        }
    }

    return (
        <div className="page-stack community-page">
            <div className="community-layout">
                <aside className="community-sidebar" aria-label="커뮤니티 둘러보기">
                    <nav className="community-sidebar-navigation" aria-label="게시글 종류">
                        {COMMUNITY_NAVIGATION_ITEMS.map((item) => (
                            <button
                                key={item.label}
                                type="button"
                                className={`community-sidebar-item${
                                    selectedCategory === item.value ? " is-active" : ""
                                }`}
                                onClick={() => {
                                    setSelectedCategory(item.value);

                                    if (item.value === "FREE_TALK") {
                                        setSelectedTopic("");
                                    }
                            }}
                            >
                                <span className="community-sidebar-icon" aria-hidden="true">
                                    {item.icon}
                                </span>
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {selectedCategory !== "FREE_TALK" && (
                        <section
                            className="community-sidebar-topics"
                            aria-labelledby="community-topic-title"
                        >
                            <h2 id="community-topic-title">주요 주제</h2>

                            <div className="community-topic-list">
                                {COMMUNITY_TOPIC_ITEMS.map((topic) => (
                                    <button
                                        key={topic.value}
                                        type="button"
                                        className={`community-topic-item${
                                            selectedTopic === topic.value ? " is-active" : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedTopic((previous) =>
                                                previous === topic.value ? "" : topic.value,
                                            );
                                        }}
                                        aria-pressed={selectedTopic === topic.value}
                                    >
                            <span
                                className="community-topic-icon"
                                aria-hidden="true"
                            >
                                        {topic.icon}
                            </span>
                                        {topic.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>

                <section className="community-board panel" aria-label="커뮤니티 게시판">
                    <header className="community-board-heading">
                        <h1>커뮤니티</h1>
                        <div className="community-search-placeholder">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="11" cy="11" r="6.5" />
                                <path d="m16 16 4.5 4.5" />
                            </svg>
                            <span>궁금한 내용을 검색해보세요.</span>
                        </div>
                    </header>

                <form className="community-write-area" onSubmit={handleSubmit}>
                    <ProfileAvatar imageUrl={member?.profileImageUrl} name={member?.nickname || ""} size={44} />
                    <div className="community-write-form">
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            onFocus={handleWriteAttempt}
                            placeholder="한국 생활에 필요한 정보를 함께 나누고 싶어요."
                            maxLength={5000}
                            aria-label="게시글 내용"
                        />
                        <label>
                            카테고리
                            <select
                                value={postCategory}
                                onChange={(event) => setPostCategory(event.target.value)}
                            >
                                <option value="QUESTION_ANSWER">질문·답변</option>
                                <option value="REVIEW_RECOMMEND">후기·추천</option>
                                <option value="FREE_TALK">자유 이야기</option>
                            </select>
                        </label>

                        <div className="community-write-toolbar">
                            <label className="community-image-picker" onClick={handleWriteAttempt}>
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
                                        <img
                                            src={imagePreviews[index]?.url}
                                            alt={`선택한 사진: ${image.name}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            aria-label={`${image.name} 삭제`}
                                        >
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {writeError && <p className="community-write-error" role="alert">{writeError}</p>}
                    </div>
                </form>

                <div className="community-feed-tabs" role="tablist" aria-label="커뮤니티 피드 선택">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={feedType === "all"}
                        className={feedType === "all" ? "is-selected" : ""}
                        onClick={() => setFeedType("all")}
                    >
                        전체 게시글
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={feedType === "reposts"}
                        className={feedType === "reposts" ? "is-selected" : ""}
                        onClick={() => setFeedType("reposts")}
                    >
                        내 리포스트
                    </button>
                </div>

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
                                onRepostChanged={handleRepostChanged}
                                onPopularityChanged={loadPopularPosts}
                                onOpenPost={setOpenedPostId}
                                isRepostFeed={feedType === "reposts"}
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

                </section>

                <aside className="community-recent-area" aria-label="최근 게시글">
                    <section className="community-recent-posts panel">
                        <header className="community-recent-posts-heading">
                            <h2>인기 게시글</h2>
                            <div className="community-popular-sort" role="tablist" aria-label="인기 게시글 정렬">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={popularSort === "likes"}
                                    className={popularSort === "likes" ? "is-selected" : ""}
                                    onClick={() => setPopularSort("likes")}
                                >
                                    공감순
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={popularSort === "views"}
                                    className={popularSort === "views" ? "is-selected" : ""}
                                    onClick={() => setPopularSort("views")}
                                >
                                    조회순
                                </button>
                            </div>
                        </header>

                        {popularPosts.length > 0 ? (
                            <ol className="community-recent-post-list">
                                {popularPosts.map((post, index) => (
                                    <li key={post.postId}>
                                        <button
                                            type="button"
                                            onClick={() => setOpenedPostId(post.postId)}
                                            aria-label={`${getPostPreview(post)} 상세 보기`}
                                        >
                                            <span className="community-recent-post-rank" aria-hidden="true">
                                                {index + 1}
                                            </span>
                                            <span className="community-recent-post-copy">
                                                <strong>{getPostPreview(post)}</strong>
                                                <small>
                                                    공감 {post.likeCount ?? 0}
                                                    {" · "}
                                                    조회 {post.viewCount ?? 0}
                                                </small>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        ) : popularError ? (
                            <p className="community-recent-post-empty" role="alert">
                                {popularError}
                            </p>
                        ) : (
                            <p className="community-recent-post-empty">아직 표시할 게시글이 없습니다.</p>
                        )}
                    </section>
                </aside>
            </div>

            <CommunityPostModal
                postId={openedPostId}
                onClose={() => setOpenedPostId(null)}
                onPostLoaded={handlePostOpened}
                onCommentCountChange={handleCommentCountChange}
            />
        </div>
    );
}
