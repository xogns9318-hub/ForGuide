import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCommunityPost } from "../../api/communityApi.js";

// 커뮤니티 게시글 작성 화면
export default function CommunityWrite() {
    const navigate = useNavigate();

    // 제목 없이 게시글 본문과 작성 언어만 입력
    const [content, setContent] = useState("");
    const [language, setLanguage] = useState("ko");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    // 취소 버튼을 누르면 커뮤니티 목록으로 돌아감
    function handleCancel() {
        navigate("/service/community");
    }

    // 작성 버튼을 누르면 본문과 작성 언어를 서버에 저장
    async function handleSubmit(event) {
        event.preventDefault();

        // 이미 저장 중이면 중복 요청 방지
        if (isSubmitting) {
            return;
        }

        // 내용에서 앞뒤 공백 제거
        const trimmedContent = content.trim();

        if (!trimmedContent) {
            setError("게시글 내용을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await createCommunityPost({
                content: trimmedContent,
                language,
            });

            navigate("/service/community");
        } catch (requestError) {
            setError(
                requestError.message || "게시글을 저장하지 못했습니다. 다시 시도해주세요.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="community-page">
            <section className="community-board">
                <h1>게시글 작성</h1>

                <form onSubmit={handleSubmit}>
                    {/* 게시글 작성 언어 선택 */}
                    <div>
                        <label htmlFor="community-language">작성 언어</label>
                        <select
                            id="community-language"
                            value={language}
                            onChange={(event) => setLanguage(event.target.value)}
                        >
                            <option value="ko">한국어</option>
                            <option value="en">English</option>
                            <option value="zh">中文</option>
                            <option value="vi">Tiếng Việt</option>
                            <option value="ja">日本語</option>
                            <option value="th">ภาษาไทย</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="community-content">내용</label>
                        <textarea
                            id="community-content"
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            maxLength={5000}
                            rows={10}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {error && <p role="alert">{error}</p>}

                    <div>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "작성 중..." : "작성하기"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
