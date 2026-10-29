import { useCallback, useEffect, useRef, useState } from "react";
import {
    createCommunityPost,
    deleteCommunityPost,
    getCommunityPostLike,
    getCommunityPostRepost,
    getMyRepostedCommunityPosts,
    getCommunityPostsByCursor,
    getPopularCommunityPosts,
    getCommunityCategories,
    getCommunityRelatedServices,
    getCommunityTopics,
    likeCommunityPost,
    repostCommunityPost,
    translateCommunityPost,
    unlikeCommunityPost,
    unrepostCommunityPost,
} from "../../api/communityApi.js";
import { confirm } from "../Modal/modal.js";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import ProfileAvatar from "../../auth/components/ProfileAvatar.jsx";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import "../../styles/community.css";
import CommunityCommentSection from "./CommunityCommentSection.jsx";
import CommunityMemberPreview from "./CommunityMemberPreview.jsx";
import CommunityPostEditForm from "./CommunityPostEditForm.jsx";
import CommunityPostModal from "./CommunityPostModal.jsx";

const MAX_IMAGE_COUNT = 4;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

// 아이콘은 화면 표현 책임이므로 프론트에서 관리한다.
// 실제 선택 코드·문구 키·표시 순서는 서버 DB에서 받아온다.
const CATEGORY_ICONS = {
    QUESTION_ANSWER: "◌",
    REVIEW_RECOMMEND: "☆",
    FREE_TALK: "◫",
};

const TOPIC_ICONS = {
    ACCOUNT: "⌂",
    LOAN: "◉",
    INSURANCE: "◇",
    VISA_STAY: "▣",
    LIFE_TIP: "◌",
};

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

function getPostPreview(post, fallback) {
    const preview = post.content?.replace(/\s+/g, " ").trim();
    return preview || fallback;
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
    const { t, i18n } = useTranslation();
    // 목록 카드별 번역문은 원문과 분리해 화면에만 보관한다.
    const [translatedContent, setTranslatedContent] = useState("");
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
    const relatedServiceLink = RELATED_SERVICE_LINKS[post.relatedService];
    const targetLanguage = i18n.resolvedLanguage || i18n.language || "ko";
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
                if (isMounted) setLikeError(t("community.post.likeLoadError"));
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
                if (isMounted) setRepostError(t("community.post.repostLoadError"));
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
            setLikeError(t("community.post.likeLoginRequired"));
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
            setLikeError(error?.message || t("community.post.likeActionError"));
        } finally {
            setIsLikeSubmitting(false);
        }
    }

    async function handleRepostClick() {
        if (!currentMemberId) {
            setRepostError(t("community.post.repostLoginRequired"));
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
            setRepostError(error?.message || t("community.post.repostActionError"));
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
                    <span aria-hidden="true">↻</span> {t("community.post.reposted")}
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
                            onClick={() => onDelete(post.postId)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? t("community.post.deleting") : t("community.post.delete")}
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
                        aria-label={t("community.post.detailsAria")}
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
                                        alt={t("community.post.imageAlt", {
                                            index: index + 1,
                                        })}
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
                            {likeInfo.likedByMe
                                ? t("community.post.unlike")
                                : t("community.post.like")}
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
                                ? t("community.post.unrepost")
                                : t("community.post.repost")}
                            <strong>{repostInfo.repostCount}</strong>
                        </button>

                        <span
                            className="community-view-count"
                            aria-label={t("community.post.viewAria", {
                                count: post.viewCount ?? 0,
                            })}
                        >
                            <svg
                                className="community-view-icon"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                                <circle cx="12" cy="12" r="2.5" />
                            </svg>
                            {t("community.post.views")} <strong>{post.viewCount ?? 0}</strong>
                        </span>

                        <button
                            type="button"
                            className="community-comment-toggle"
                            onClick={() => setIsCommentsOpen((value) => !value)}
                            aria-expanded={isCommentsOpen}
                        >
                            <span aria-hidden="true">▱</span>
                            {isCommentsOpen
                                ? t("community.post.closeComments")
                                : t("community.post.comments")}
                            {!isCommentsOpen && <strong>{post.commentCount ?? 0}</strong>}
                        </button>
                    </div>

                    {likeError && (
                        <p className="community-like-error" role="alert">
                            {likeError}
                        </p>
                    )}
                    {repostError && (
                        <p className="community-like-error" role="alert">
                            {repostError}
                        </p>
                    )}
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
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { accessToken, member } = useAuthStore();
    const currentMemberId = member?.memberId;
    const [posts, setPosts] = useState([]);
    const [popularPosts, setPopularPosts] = useState([]);
    const [popularError, setPopularError] = useState("");
    const [popularSort, setPopularSort] = useState("likes");
    const [popularTranslations, setPopularTranslations] = useState({});
    const targetLanguage = i18n.resolvedLanguage || i18n.language || "ko";
    const [feedType, setFeedType] = useState("all");
    const [postCategory, setPostCategory] = useState("FREE_TALK");
    const [relatedService, setRelatedService] = useState("");
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [topicOptions, setTopicOptions] = useState([]);
    const [relatedServiceOptions, setRelatedServiceOptions] = useState([]);
    const [isOptionsLoading, setIsOptionsLoading] = useState(true);
    const [optionsLoadError, setOptionsLoadError] = useState(false);
    const [optionsReloadKey, setOptionsReloadKey] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
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
    const loadingRef = useRef(false);
    const cursorCreatedAtRef = useRef(null);
    const cursorPostIdRef = useRef(null);
    const hasMoreRef = useRef(true);
    const previewUrlsRef = useRef(new Set());

    useEffect(
        () => () => {
            // 화면을 떠날 때 선택 사진의 브라우저 임시 주소를 정리한다.
            previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        },
        [],
    );

    // 카테고리·주제는 DB의 활성 옵션을 최초 한 번 조회한다.
    useEffect(() => {
        let isMounted = true;

        async function loadCommunityOptions() {
            setIsOptionsLoading(true);
            setOptionsLoadError(false);

            try {
                const [categories, topics] = await Promise.all([
                    getCommunityCategories(),
                    getCommunityTopics(),
                ]);

                if (!isMounted) {
                    return;
                }

                const nextCategories = Array.isArray(categories) ? categories : [];
                const nextTopics = Array.isArray(topics) ? topics : [];

                setCategoryOptions(nextCategories);
                setTopicOptions(nextTopics);

                // 기본 카테고리가 DB에서 비활성화됐다면 첫 활성 카테고리를 선택한다.
                setPostCategory((previous) =>
                    nextCategories.some((option) => option.code === previous)
                        ? previous
                        : (nextCategories[0]?.code ?? ""),
                );
            } catch {
                if (isMounted) {
                    setCategoryOptions([]);
                    setTopicOptions([]);
                    setPostCategory("");
                    setOptionsLoadError(true);
                }
            } finally {
                if (isMounted) {
                    setIsOptionsLoading(false);
                }
            }
        }

        loadCommunityOptions();

        return () => {
            isMounted = false;
        };
    }, [optionsReloadKey]);

    // 옵션 조회가 실패한 경우 사용자가 같은 요청을 다시 보낼 수 있게 한다.
    function retryLoadCommunityOptions() {
        setOptionsReloadKey((previous) => previous + 1);
    }

    // 선택한 카테고리에 연결된 관련 서비스만 다시 조회한다.
    useEffect(() => {
        let isMounted = true;

        async function loadRelatedServices() {
            if (!postCategory) {
                setRelatedService("");
                setRelatedServiceOptions([]);
                return;
            }

            // 카테고리가 바뀌면 이전 카테고리의 서비스 선택을 초기화한다.
            setRelatedService("");
            setRelatedServiceOptions([]);

            try {
                const response = await getCommunityRelatedServices(postCategory);

                if (isMounted) {
                    setRelatedServiceOptions(Array.isArray(response) ? response : []);
                }
            } catch {
                if (isMounted) {
                    setRelatedServiceOptions([]);
                }
            }
        }

        loadRelatedServices();

        return () => {
            isMounted = false;
        };
    }, [postCategory]);

    // 오른쪽 인기 게시글은 전체 글을 기준으로 공감순 또는 조회순을 서버에서 정렬해 가져온다.
    const loadPopularPosts = useCallback(async () => {
        try {
            const response = await getPopularCommunityPosts(popularSort);
            setPopularPosts(Array.isArray(response) ? response : []);
            setPopularError("");
        } catch (requestError) {
            setPopularError(requestError?.message || t("community.feedback.popularLoadError"));
        }
    }, [popularSort, t]);

    useEffect(() => {
        loadPopularPosts();
    }, [loadPopularPosts]);

    // 사이트 언어 또는 인기 게시글이 바뀌면 최대 3개의 인기 게시글을 자동 번역
    useEffect(() => {
        let isMounted = true;

        async function translatePopularPosts() {
            // 언어를 바꾸는 순간 이전 언어의 번역문은 먼저 비운다.
            setPopularTranslations({});

            const nextTranslations = {};

            for (const post of popularPosts) {
                // 원문 언어와 현재 사이트 언어가 같으면 번역할 필요가 없다.
                if (!post.content?.trim() || !post.language || post.language === targetLanguage) {
                    continue;
                }

                try {
                    const response = await translateCommunityPost(post.postId, targetLanguage);

                    if (response.translatedText) {
                        nextTranslations[post.postId] = response.translatedText;
                    }
                } catch {
                    // 자동 번역 실패 시에는 원문을 그대로 보여 준다.
                }
            }

            if (isMounted) {
                setPopularTranslations(nextTranslations);
            }
        }

        translatePopularPosts();

        return () => {
            isMounted = false;
        };
    }, [popularPosts, targetLanguage]);

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
                setError(t("community.feedback.myRepostsLoginRequired"));
                return;
            }

            const response =
                feedType === "reposts"
                    ? await getMyRepostedCommunityPosts()
                    : await getCommunityPostsByCursor({
                          cursorCreatedAt: cursorCreatedAtRef.current,
                          cursorPostId: cursorPostIdRef.current,
                          category: selectedCategory || null,
                          topic: selectedTopic || null,
                          keyword: searchKeyword || null,
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
            setError(requestError?.message || t("community.feedback.postsLoadError"));
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
    }, [feedType, selectedCategory, selectedTopic, searchKeyword]);

    const observerTarget = useInfiniteScroll({
        enabled: hasMore,
        onLoadMore: loadMorePosts,
    });

    function handleImageChange(event) {
        if (!accessToken || !currentMemberId) {
            event.target.value = "";
            navigate("/login");
            return;
        }

        const selectedImages = Array.from(event.target.files || []);
        const totalImages = images.length + selectedImages.length;

        if (totalImages > MAX_IMAGE_COUNT) {
            setWriteError(
                t("community.feedback.imageCountLimit", {
                    count: MAX_IMAGE_COUNT,
                }),
            );
            event.target.value = "";
            return;
        }

        const invalidImage = selectedImages.find(
            (file) =>
                !["image/jpeg", "image/png"].includes(file.type) || file.size > MAX_IMAGE_BYTES,
        );
        if (invalidImage) {
            setWriteError(t("community.feedback.imageValidation"));
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
            setWriteError(t("community.feedback.writeLoginRequired"));
            window.setTimeout(() => navigate("/login"), 900);
            return;
        }
        // 서버 옵션을 확인할 수 없으면 잘못된 카테고리로 게시글을 저장하지 않는다.
        if (isOptionsLoading || optionsLoadError || !postCategory) {
            setWriteError(t("community.feedback.optionsLoadError"));
            return;
        }
        // 글 또는 사진 중 하나는 있어야 게시글을 작성할 수 있다.
        if (!trimmedContent && images.length === 0) {
            setWriteError(t("community.feedback.contentRequired"));
            return;
        }

        setIsSubmitting(true);
        setWriteError("");
        try {
            const formData = new FormData();
            formData.append("content", trimmedContent);
            formData.append("category", postCategory);
            formData.append("relatedService", relatedService);
            formData.append("language", i18n.language || "ko");
            images.forEach((image) => formData.append("images", image));
            await createCommunityPost(formData);

            setContent("");
            setRelatedService("");
            clearSelectedImages();
            cursorCreatedAtRef.current = null;
            cursorPostIdRef.current = null;
            hasMoreRef.current = true;
            setHasMore(true);
            setPosts([]);
            await loadMorePosts();
            await loadPopularPosts();
        } catch (requestError) {
            setWriteError(requestError?.message || t("community.feedback.writeFailed"));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(postId) {
        if (!(await confirm(t("community.feedback.deleteConfirm")))) return;

        setDeletingPostId(postId);
        setDeleteError("");
        try {
            await deleteCommunityPost(postId);
            setPosts((previous) => previous.filter((post) => post.postId !== postId));
            await loadPopularPosts();
        } catch (requestError) {
            setDeleteError(requestError?.message || t("community.feedback.deleteFailed"));
        } finally {
            setDeletingPostId(null);
        }
    }

    function handleUpdatePost(updatedPost) {
        setPosts((previous) =>
            previous.map((post) => (post.postId === updatedPost.postId ? updatedPost : post)),
        );
    }

    // 상세 모달 API가 돌려준 최신 조회수·댓글 수를 피드에도 바로 반영한다.
    const handlePostOpened = useCallback(
        (updatedPost) => {
            setPosts((previous) =>
                previous.map((post) => (post.postId === updatedPost.postId ? updatedPost : post)),
            );
            loadPopularPosts();
        },
        [loadPopularPosts],
    );

    // 댓글 영역이 최신 댓글 수를 알려오면 해당 게시글 카드만 즉시 갱신한다.
    function handleCommentCountChange(postId, commentCount) {
        setPosts((previous) =>
            previous.map((post) => (post.postId === postId ? { ...post, commentCount } : post)),
        );
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
                <aside
                    className="community-sidebar"
                    aria-label={t("community.accessibility.explore")}
                >
                    <nav
                        className="community-sidebar-navigation"
                        aria-label={t("community.accessibility.postTypeNavigation")}
                    >
                        {[
                            {
                                icon: "▤",
                                labelKey: "community.navigation.allPosts",
                                value: "",
                            },
                            ...categoryOptions.map((option) => ({
                                icon: CATEGORY_ICONS[option.code] ?? "•",
                                labelKey: option.labelKey,
                                value: option.code,
                            })),
                        ].map((item) => (
                            <button
                                key={item.value}
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
                                {t(item.labelKey)}
                            </button>
                        ))}
                    </nav>

                    {selectedCategory !== "FREE_TALK" && (
                        <section
                            className="community-sidebar-topics"
                            aria-labelledby="community-topic-title"
                        >
                            <h2 id="community-topic-title">{t("community.topics.title")}</h2>

                            <div className="community-topic-list">
                                {topicOptions.map((topic) => (
                                    <button
                                        key={topic.code}
                                        type="button"
                                        className={`community-topic-item${
                                            selectedTopic === topic.code ? " is-active" : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedTopic((previous) =>
                                                previous === topic.code ? "" : topic.code,
                                            );
                                        }}
                                        aria-pressed={selectedTopic === topic.code}
                                    >
                                        <span className="community-topic-icon" aria-hidden="true">
                                            {TOPIC_ICONS[topic.code] ?? "•"}
                                        </span>
                                        {t(topic.labelKey)}
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>

                <section
                    className="community-board panel"
                    aria-label={t("community.accessibility.board")}
                >
                    <header className="community-board-heading">
                        <h1>{t("community.board.title")}</h1>
                        <form
                            className="community-search-placeholder"
                            onSubmit={(event) => {
                                event.preventDefault();
                                setSearchKeyword(searchInput.trim());
                            }}
                        >
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder={t("community.board.searchPlaceholder")}
                                aria-label={t("community.board.searchAria")}
                            />

                            <button
                                type="submit"
                                aria-label={t("community.board.searchSubmitAria")}
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <circle cx="11" cy="11" r="6.5" />
                                    <path d="m16 16 4.5 4.5" />
                                </svg>
                            </button>
                        </form>
                    </header>

                    <form className="community-write-area" onSubmit={handleSubmit}>
                        <ProfileAvatar
                            imageUrl={member?.profileImageUrl}
                            name={member?.nickname || ""}
                            size={44}
                        />
                        <div className="community-write-form">
                            <textarea
                                value={content}
                                onChange={(event) => setContent(event.target.value)}
                                onFocus={handleWriteAttempt}
                                placeholder={t("community.board.writePlaceholder")}
                                maxLength={5000}
                                aria-label={t("community.board.writeAria")}
                            />
                            {optionsLoadError && (
                                <div className="community-options-error" role="alert">
                                    <p>{t("community.feedback.optionsLoadError")}</p>
                                    <button type="button" onClick={retryLoadCommunityOptions}>
                                        {t("community.feed.retry")}
                                    </button>
                                </div>
                            )}
                            <div className="community-write-selects">
                                <label>
                                    {t("community.board.categoryLabel")}
                                    <select
                                        value={postCategory}
                                        disabled={isOptionsLoading || optionsLoadError}
                                        onChange={(event) => {
                                            const nextCategory = event.target.value;

                                            setPostCategory(nextCategory);
                                        }}
                                    >
                                        {categoryOptions.map((option) => (
                                            <option key={option.code} value={option.code}>
                                                {t(option.labelKey)}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                {relatedServiceOptions.length > 0 && (
                                    <label>
                                        {t("community.board.relatedServiceLabel")}
                                        <select
                                            value={relatedService}
                                            disabled={isOptionsLoading}
                                            onChange={(event) =>
                                                setRelatedService(event.target.value)
                                            }
                                        >
                                            <option value="">
                                                {t("community.board.noRelatedService")}
                                            </option>
                                            {relatedServiceOptions.map((option) => (
                                                <option key={option.code} value={option.code}>
                                                    {t(option.labelKey)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                )}
                            </div>

                            <div className="community-write-toolbar">
                                <label
                                    className="community-image-picker"
                                    onClick={handleWriteAttempt}
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <rect x="3" y="4" width="18" height="16" rx="3" />
                                        <circle cx="9" cy="10" r="1.5" />
                                        <path d="m4.5 18 5-5 3.5 3 2.5-2.5 4 4.5" />
                                    </svg>
                                    {t("community.board.addImage")}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png"
                                        multiple
                                        onChange={handleImageChange}
                                    />
                                </label>

                                <span className="community-image-guide">
                                    {t("community.board.imageGuide")}
                                </span>

                                <button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        isOptionsLoading ||
                                        optionsLoadError ||
                                        !postCategory
                                    }
                                >
                                    {isSubmitting
                                        ? t("community.board.submitting")
                                        : t("community.board.submit")}{" "}
                                </button>
                            </div>
                            {images.length > 0 && (
                                <ul className="community-selected-images">
                                    {images.map((image, index) => (
                                        <li key={`${image.name}-${index}`}>
                                            <img
                                                src={imagePreviews[index]?.url}
                                                alt={t("community.feed.selectedImageAlt", {
                                                    name: image.name,
                                                })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                aria-label={t("community.feed.deleteImageAria", {
                                                    name: image.name,
                                                })}
                                            >
                                                <span aria-hidden="true">×</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {writeError && (
                                <p className="community-write-error" role="alert">
                                    {writeError}
                                </p>
                            )}
                        </div>
                    </form>

                    <div
                        className="community-feed-tabs"
                        role="tablist"
                        aria-label={t("community.feed.tabsAria")}
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={feedType === "all"}
                            className={feedType === "all" ? "is-selected" : ""}
                            onClick={() => setFeedType("all")}
                        >
                            {t("community.feed.allPosts")}
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={feedType === "reposts"}
                            className={feedType === "reposts" ? "is-selected" : ""}
                            onClick={() => setFeedType("reposts")}
                        >
                            {t("community.feed.myReposts")}
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

                        {isLoading && (
                            <p className="community-state-message">{t("community.feed.loading")}</p>
                        )}
                        {error && (
                            <div className="community-state-message" role="alert">
                                <p>{error}</p>
                                <button type="button" onClick={loadMorePosts}>
                                    {t("community.feed.retry")}
                                </button>
                            </div>
                        )}
                        {!isLoading && !error && posts.length === 0 && (
                            <p className="community-state-message">{t("community.feed.empty")}</p>
                        )}
                        {deleteError && (
                            <p className="community-write-error" role="alert">
                                {deleteError}
                            </p>
                        )}
                        {!hasMore && posts.length > 0 && (
                            <p className="community-end-message">{t("community.feed.end")}</p>
                        )}
                        <div ref={observerTarget} aria-hidden="true" />
                    </div>
                </section>

                <aside
                    className="community-recent-area"
                    aria-label={t("community.feed.popularAreaAria")}
                >
                    <section className="community-recent-posts panel">
                        <header className="community-recent-posts-heading">
                            <h2>{t("community.feed.popularTitle")}</h2>
                            <div
                                className="community-popular-sort"
                                role="tablist"
                                aria-label={t("community.feed.popularSortAria")}
                            >
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={popularSort === "likes"}
                                    className={popularSort === "likes" ? "is-selected" : ""}
                                    onClick={() => setPopularSort("likes")}
                                >
                                    {t("community.feed.sortByLikes")}
                                </button>
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={popularSort === "views"}
                                    className={popularSort === "views" ? "is-selected" : ""}
                                    onClick={() => setPopularSort("views")}
                                >
                                    {t("community.feed.sortByViews")}
                                </button>
                            </div>
                        </header>

                        {popularPosts.length > 0 ? (
                            <ol className="community-recent-post-list">
                                {popularPosts.map((post, index) => {
                                    const originalPreview = getPostPreview(
                                        post,
                                        t("community.feedback.imageOnlyPost"),
                                    );

                                    // 자동 번역 완료됐으면 번역문을, 아직 없거나 실패했으면 원문 쓰기
                                    const displayedPreview =
                                        popularTranslations[post.postId] || originalPreview;

                                    return (
                                        <li key={post.postId}>
                                            <button
                                                type="button"
                                                onClick={() => setOpenedPostId(post.postId)}
                                                aria-label={t("community.feed.popularDetailsAria", {
                                                    preview: displayedPreview,
                                                })}
                                            >
                                                <span
                                                    className="community-recent-post-rank"
                                                    aria-hidden="true"
                                                >
                                                    {index + 1}
                                                </span>
                                                <span className="community-recent-post-copy">
                                                    <strong>{displayedPreview}</strong>
                                                    <small>
                                                        {t("community.feed.likeCount", {
                                                            count: post.likeCount ?? 0,
                                                        })}
                                                        {" · "}
                                                        {t("community.feed.viewCount", {
                                                            count: post.viewCount ?? 0,
                                                        })}
                                                    </small>
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        ) : popularError ? (
                            <p className="community-recent-post-empty" role="alert">
                                {popularError}
                            </p>
                        ) : (
                            <p className="community-recent-post-empty">
                                {t("community.feed.popularEmpty")}
                            </p>
                        )}
                    </section>
                </aside>
            </div>

            <CommunityPostModal
                postId={openedPostId}
                onClose={() => setOpenedPostId(null)}
                onPostLoaded={handlePostOpened}
                onCommentCountChange={handleCommentCountChange}
                onPostDeleted={(postId) => {
                    setPosts((previous) => previous.filter((post) => post.postId !== postId));
                    loadPopularPosts();
                }}
            />
        </div>
    );
}
