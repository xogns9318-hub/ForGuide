import { useEffect, useState } from "react";
import { getCommunityPosts } from "../../api/communityApi.js";
import "../../styles/community.css";

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

            <p className="community-post-content">{post.content}</p>

            <div className="community-post-actions" aria-label="게시글 반응">
                <span>♡ {post.likes ?? 0}</span>
                <span>◯ 댓글 {post.comments ?? 0}</span>
                <span>↪ 0</span>
            </div>

            {post.reply && (
                <div className="community-reply">
                    <strong>가*</strong>
                    <p>{post.reply}</p>
                </div>
            )}
        </article>
    );
}

export default function Community() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 커뮤니티 화면이 처음 나타날 때 서버에서 게시글을 조회
    useEffect(() => {
        getCommunityPosts().then((data) => {
            setPosts(data);
        })
            .catch((err) => {
                setError(err.message);
            })
            .finally(() => {
                setIsLoading(false);
            });
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
                    <button type="button">작성</button>
                </div>

                <div className="community-post-area">
                    {isLoading ? (
                        <p className="community-loading">게시글을 불러오는 중입니다.</p>
                    ) : error ? (
                        <p role="alert">{error}</p>
                    ) : (
                        <div className="community-post-list">
                            {posts.map((post) => (
                                <PostCard key={post.postId} post={post} />
                            ))}
                        </div>
                    )}
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
