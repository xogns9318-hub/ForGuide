import { useEffect, useRef, useState } from "react";
import { getCommunityPostsByCursor } from "../../api/communityApi.js";
import "../../styles/community.css";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/store/useAuthStore.js";



function PostCard({ post }) {
    return (
        <article className="community-post-card">
            <div className="community-author">
                <div className="community-avatar" aria-hidden="true">♙</div>
                <div>
                    <strong>{post.nickname}</strong>
                    <p>
                        {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString("ko-KR")
                            : "작성일 없음"}
                    </p>
                </div>
            </div>

            {/* 서버에서 실제로 조회한 게시글 내용만 표시 */}
            <p className="community-post-content">{post.content}</p>

            {/* 댓글과 좋아요 기능은 API 구현 후 연결할 예정 */}
        </article>
    );
}


export default function Community() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    // 게시글 목록 마지막에 배치할 감시 요소
    const observerTarget = useRef(null);

    // 중복 API 요청을 막기 위한 값
    const loadingRef = useRef(false);

    // 마지막 게시글의 작성 시간과 번호를 기억
    const cursorRef = useRef(null);

    // 다음 게시글이 남아 있는지 기억
    const hasMoreRef = useRef(true);

    // API 요청 실패 여부를 기억해 자동 재요청을 방지
    const errorRef = useRef(false);

    const navigate = useNavigate();

    // 로그인 정보가 준비되었는지 확인
    const initialized = useAuthStore((state) => state.initialized);

    // 현재 로그인한 사용자의 액세스 토큰 확인
    const accessToken = useAuthStore((state) => state.accessToken);


    function handleWriteClick() {
        // 로그인 상태 확인 안 끝나면 이동하지 않음
        if (!initialized) {
            return;
        }

        // 로그인하지 않은 사용자는 로그인 페이지로 이동
        if(!accessToken) {
            alert("게시글을 작성하려면 로그인이 필요합니다.");
            navigate("/login");
            return;
        }

        //로그인한 사용자는 게시글 작성 페이지로 이동
        navigate("/service/community/write");
    }
    // 커뮤니티 화면이 처음 나타날 때 서버에서 게시글을 조회

    // 게시글을 한 번에 10개씩 가져오는 함수
    async function loadMorePosts() {
        // 이미 요청 중이거나 더 가져올 게시글이 없으면 중단
        if (loadingRef.current || !hasMoreRef.current) {
            return;
        }

        loadingRef.current = true;

        //사용자가 재시도하거나 새 요청을 시작하면 이전 오류 상태 초기화
        errorRef.current = false;
        setIsLoading(true);
        setError(null);

        try {
            // 첫 요청은 커서 없이, 이후 요청은 마지막 게시글 정보를 전달
            const nextPosts = await getCommunityPostsByCursor({
                cursorCreatedAt: cursorRef.current?.createdAt,
                cursorPostId: cursorRef.current?.postId,
                size: 10,
            });

            // 서버 응답이 배열인지 확인
            if (!Array.isArray(nextPosts)) {
                throw new Error("게시글 응답 형식이 올바르지 않습니다.");
            }

            // 기존 게시글을 유지하고 새 게시글을 뒤에 추가
            setPosts((previousPosts) => [...previousPosts, ...nextPosts]);

            // 마지막 게시글 정보를 다음 페이지 요청에 사용
            if (nextPosts.length > 0) {
                const lastPost = nextPosts[nextPosts.length - 1];

                cursorRef.current = {
                    createdAt: lastPost.createdAt,
                    postId: lastPost.postId,
                };
            }

            // 요청한 10개보다 적게 오면 마지막 페이지로 판단
            if (nextPosts.length < 10) {
                hasMoreRef.current = false;
                setHasMore(false);
            }
        } catch (err) {
            //요청 실패하면 스크롤 감시에 의한 자동 재요청 막음
            errorRef.current = true;
            setError(err.message);
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }

    // 커뮤니티 화면이 처음 나타날 때 첫 페이지 조회
    useEffect(() => {
        loadMorePosts();
    }, []);

    // 게시글 목록 아래의 감시 요소가 화면에 보이면 다음 페이지 요청
    useEffect(() => {
        const target = observerTarget.current;

        //아직 감시할 HTML 요소가 없다면 실행하지 않음
        if (!target) {
            return;
        }

        // 감시 요소가 화면에 들어오는지 확인
        const observer = new IntersectionObserver(
            (entries) => {
                //화면에 들어왔고, 로딩 중 아니며, 다음 페이지가 있을 때만 조회
                if(
                    entries[0].isIntersecting &&
                    !loadingRef.current &&
                    !errorRef.current &&
                    hasMoreRef.current
                ) {
                    loadMorePosts();
                }
            },
            {
                // 화면 아래쪽 200px 전부터 다음 게시글 미리 불러오기
                rootMargin: "200px",
            }
        );

        // 감시 시작
        observer.observe(target);

        //화면을 벗어날 때 감시를 해제해 불필요한 동작 방지
        return () => {
            observer.disconnect();
        };
    }, []);


    return (
        <div className="community-page">
            <section className="community-hero" aria-labelledby="community-title">
                <div>
                    <h1 id="community-title">커뮤니티</h1>
                    <p>한국 생활의 경험과 정보를 나누고, 서로의 이야기를 만나보세요.</p>
                </div>
                <div className="community-hero-arch" aria-hidden="true" />
            </section>

            <section className="community-board" aria-labelledby="community-board-title">
                <div className="community-board-title">
                    <h2 id="community-board-title">커뮤니티</h2>
                    <p>한국 생활의 질문과 경험을 함께 나누는 공간</p>
                </div>

                <div className="community-write-area">
                    <div className="community-avatar" aria-hidden="true">♙</div>
                    <p>한국 생활에 필요한 정보를 함께 나누고 싶어요.</p>
                    <button type="button"
                            onClick={handleWriteClick}
                            disabled={!initialized}>작성</button>
                </div>


                <div className="community-post-area">
                    {/* 이미 불러온 게시글은 추가 로딩 중에도 계속 표시 */}
                    <div className="community-post-list">
                        {posts.map((post) => (
                            <PostCard key={post.postId} post={post} />
                        ))}
                    </div>

                    {/* 첫 조회가 끝났는데 게시글이 없으면 빈 목록 안내 */}
                    {!isLoading && !error && posts.length === 0 && (
                        <p>아직 작성된 게시글이 없습니다.</p>
                    )}

                    {/* 처음 조회할 때와 추가 게시글을 조회할 때 모두 로딩 안내 */}
                    {isLoading && (
                        <p className="community-loading">
                            게시글을 불러오는 중입니다.
                        </p>
                    )}

                    {/* API 요청에 실패하면 오류와 재시도 버튼 표시 */}
                    {error && (
                        <div role="alert">
                            <p>{error}</p>
                            <button type="button" onClick={loadMorePosts}>
                                다시 시도
                            </button>
                        </div>
                    )}

                    {/* 다음 게시글이 없으면 마지막 페이지 안내 */}
                    {!hasMore && posts.length > 0 && (
                        <p>모든 게시글을 불러왔습니다.</p>
                    )}

                    {/* 이 요소가 화면에 보이면 IntersectionObserver가 다음 페이지를 요청 */}
                    <div ref={observerTarget} aria-hidden="true" />
                </div>


                <div className="community-notice-area">
                    <button type="button" className="community-notice-button">
                        안내 확인하기
                    </button>
                </div>
            </section>
        </div>
    );
}
