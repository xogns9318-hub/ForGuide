import { useEffect, useState, useCallback, useRef } from "react";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import { useTranslation } from "react-i18next";
import { getCommunityMemberPosts } from "../../api/communityApi.js";
import ProfileAvatar from "../../auth/components/ProfileAvatar.jsx";
import CommunityPostModal from "./CommunityPostModal.jsx";

const MEMBER_POST_PAGE_SIZE = 10;

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
    const [hasMore, setHasMore] = useState(true);
    const loadingRef = useRef(false);
    const cursorCreatedAtRef = useRef(null);
    const cursorPostIdRef = useRef(null);
    const hasMoreRef = useRef(true);
    const activeMemberIdRef = useRef(null);
    const requestVersionRef = useRef(0);

    const loadMorePosts = useCallback(
        async (requestVersion = requestVersionRef.current) => {
            if (
                !isOpen ||
                !memberId ||
                loadingRef.current ||
                !hasMoreRef.current
            ) {
                return;
            }

            const requestedMemberId = memberId;

            loadingRef.current = true;
            setIsLoading(true);
            setError("");

            try {
                const response = await getCommunityMemberPosts(requestedMemberId, {
                    cursorCreatedAt: cursorCreatedAtRef.current,
                    cursorPostId: cursorPostIdRef.current,
                    size: MEMBER_POST_PAGE_SIZE,
                });

                // 모달을 닫았거나 다른 회원 목록을 연 경우 이전 응답은 무시한다.
                if (
                    requestVersion !== requestVersionRef.current ||
                    activeMemberIdRef.current !== requestedMemberId
                ) {
                    return;
                }

                const receivedPosts = Array.isArray(response) ? response : [];

                // observer 중복 감지에도 동일한 게시글이 두 번 보이지 않게 한다.
                setPosts((previous) => {
                    const postIds = new Set(previous.map((post) => post.postId));

                    return [
                        ...previous,
                        ...receivedPosts.filter((post) => !postIds.has(post.postId)),
                    ];
                });

                const lastPost = receivedPosts.at(-1);

                cursorCreatedAtRef.current = lastPost?.createdAt ?? cursorCreatedAtRef.current;
                cursorPostIdRef.current = lastPost?.postId ?? cursorPostIdRef.current;

                const nextHasMore = receivedPosts.length === MEMBER_POST_PAGE_SIZE;

                hasMoreRef.current = nextHasMore;
                setHasMore(nextHasMore);
            } catch (requestError) {
                if (
                    requestVersion === requestVersionRef.current &&
                    activeMemberIdRef.current === requestedMemberId
                ) {
                    setError(
                        requestError?.message || t("community.memberPosts.error"),
                    );

                    hasMoreRef.current = false;
                    setHasMore(false);
                }
            } finally {
                // 현재 요청일 때만 로딩 상태를 해제한다.
                if (requestVersion === requestVersionRef.current) {
                    loadingRef.current = false;
                    setIsLoading(false);
                }
            }
        },
        [isOpen, memberId, t],
    );

    // 모달을 새로 열거나 다른 회원을 선택하면 목록과 커서를 초기화한다.
    useEffect(() => {
        const requestVersion = requestVersionRef.current + 1;
        requestVersionRef.current = requestVersion;

        if (!isOpen || !memberId) {
            activeMemberIdRef.current = null;
            return undefined;
        }

        activeMemberIdRef.current = memberId;
        loadingRef.current = false;
        cursorCreatedAtRef.current = null;
        cursorPostIdRef.current = null;
        hasMoreRef.current = true;

        setPosts([]);
        setError("");
        setHasMore(true);

        void loadMorePosts(requestVersion);

        return () => {
            if (requestVersionRef.current === requestVersion) {
                requestVersionRef.current += 1;
                activeMemberIdRef.current = null;
            }
        };
    }, [isOpen, memberId, loadMorePosts]);

    const observerTarget = useInfiniteScroll({
        enabled: isOpen && hasMore,
        onLoadMore: loadMorePosts,
    });

    function retryLoadMorePosts() {
        hasMoreRef.current = true;
        setHasMore(true);
        void loadMorePosts();
    }

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
                        {!isLoading && error && (
                            <div className="community-state-message" role="alert">
                                <p>{error}</p>
                                <button type="button" onClick={retryLoadMorePosts}>
                                    {t("community.feed.retry")}
                                </button>
                            </div>
                        )}
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

                        {!isLoading && !error && !hasMore && posts.length > 0 && (
                            <p className="community-end-message">
                                {t("community.feed.end")}
                            </p>
                        )}

                        <div ref={observerTarget} aria-hidden="true" />
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
