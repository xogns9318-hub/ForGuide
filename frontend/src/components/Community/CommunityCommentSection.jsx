import { useEffect, useState } from "react";
import {
    createCommunityComment,
    deleteCommunityComment,
    getCommunityComments,
    updateCommunityComment,
} from "../../api/communityApi.js";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import { useNavigate } from "react-router-dom";
import CommunityMemberPreview from "./CommunityMemberPreview.jsx";

// 게시글 하나에 연결되는 댓글 목록·작성 영역
export default function CommunityCommentSection({
    postId,
    postMemberId,
    onCommentCountChange,
}) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState("");
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [error, setError] = useState("");
    const [writeError, setWriteError] = useState("");

    const accessToken = useAuthStore((state) => state.accessToken);
    const member = useAuthStore((state) => state.member);
    const navigate = useNavigate();

    // 댓글 작성 뒤에도 재사용해 목록을 즉시 최신 상태로 갱신한다
    async function loadComments() {
        setIsLoading(true);
        setError("");

        try {
            const nextComments = await getCommunityComments(postId);
            setComments(nextComments);
            // 댓글을 열었을 때도 서버의 실제 개수로 게시글 카드 숫자를 맞춘다.
            onCommentCountChange?.(postId, nextComments.length);
        } catch (requestError) {
            setError(
                requestError.message
                || "댓글을 불러오지 못했습니다.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadComments();
    }, [postId]);

    async function handleSubmit(event) {
        event.preventDefault();

        const trimmedContent = content.trim();

        if (!trimmedContent) {
            setWriteError("댓글 내용을 입력해주세요.");
            return;
        }

        if (trimmedContent.length > 1000) {
            setWriteError("댓글은 1000자 이하여야 합니다.");
            return;
        }

        if (!accessToken) {
            setWriteError("댓글을 작성하려면 로그인이 필요합니다.");
            window.alert("댓글을 작성하려면 로그인해주세요.");
            navigate("/login");
            return;
        }

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setWriteError("");

        try {
            await createCommunityComment(postId, trimmedContent);

            setContent("");
            await loadComments();
        } catch (requestError) {
            setWriteError(
                requestError.message
                || "댓글을 저장하지 못했습니다.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function startEditing(comment) {
        setEditingCommentId(comment.commentId);
        setEditingContent(comment.content);
        setWriteError("");
    }

    function cancelEditing() {
        setEditingCommentId(null);
        setEditingContent("");
    }

    async function handleUpdate(event, commentId) {
        event.preventDefault();

        const trimmedContent = editingContent.trim();

        if (!trimmedContent) {
            setWriteError("댓글 내용을 입력해주세요.");
            return;
        }

        if (trimmedContent.length > 1000) {
            setWriteError("댓글은 1000자 이하여야 합니다.");
            return;
        }

        setIsSubmitting(true);
        setWriteError("");

        try {
            await updateCommunityComment(postId, commentId, trimmedContent);
            setEditingCommentId(null);
            setEditingContent("");
            await loadComments();
        } catch (requestError) {
            setWriteError(
                requestError.message || "댓글을 수정하지 못했습니다.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(commentId) {
        if (!window.confirm("이 댓글을 삭제할까요?")) {
            return;
        }

        setDeletingCommentId(commentId);
        setWriteError("");

        try {
            await deleteCommunityComment(postId, commentId);

            // 삭제 성공 즉시 해당 댓글만 목록에서 제거한다.
            setComments((currentComments) =>
                currentComments.filter(
                    (comment) => comment.commentId !== commentId,
                ),
            );
            onCommentCountChange?.(postId, Math.max(comments.length - 1, 0));
        } catch (requestError) {
            setWriteError(
                requestError.message || "댓글을 삭제하지 못했습니다.",
            );
        } finally {
            setDeletingCommentId(null);
        }
    }

    return (
        <section className="community-comments">
            <h3>댓글</h3>

            {isLoading && <p>댓글을 불러오는 중입니다.</p>}

            {!isLoading && error && (
                <p role="alert">{error}</p>
            )}

            {!isLoading && !error && comments.length === 0 && (
                <p>아직 댓글이 없습니다.</p>
            )}

            {!isLoading && !error && comments.length > 0 && (
                <ul className="community-comment-list">
                    {comments.map((comment) => (
                        <li
                            key={comment.commentId}
                            className="community-comment-item"
                        >
                            <CommunityMemberPreview
                                memberId={comment.memberId}
                                imageUrl={comment.profileImageUrl}
                                nickname={comment.nickname}
                                size={30}
                            />

                            <div className="community-comment-body">
                                <strong>{comment.nickname}</strong>

                                {editingCommentId === comment.commentId ? (
                                    <form
                                        className="community-comment-edit-form"
                                        onSubmit={(event) =>
                                            handleUpdate(event, comment.commentId)
                                        }
                                    >
                                        <textarea
                                            value={editingContent}
                                            onChange={(event) =>
                                                setEditingContent(event.target.value)
                                            }
                                            maxLength={1000}
                                            rows={3}
                                            disabled={isSubmitting}
                                        />
                                        <div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                            >
                                                수정
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEditing}
                                                disabled={isSubmitting}
                                            >
                                                취소
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(comment.commentId)}
                                                disabled={
                                                    deletingCommentId === comment.commentId
                                                }
                                            >
                                                {deletingCommentId === comment.commentId
                                                    ? "삭제 중..."
                                                    : "삭제"}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <p>{comment.content}</p>
                                    </>
                                )}

                                {editingCommentId !== comment.commentId
                                    && (comment.memberId === member?.memberId
                                    || postMemberId === member?.memberId) && (
                                    <div className="community-comment-actions">
                                        {comment.memberId === member?.memberId && (
                                            <button
                                                type="button"
                                                onClick={() => startEditing(comment)}
                                                disabled={isSubmitting}
                                            >
                                                수정
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(comment.commentId)}
                                            disabled={
                                                deletingCommentId === comment.commentId
                                            }
                                        >
                                            {deletingCommentId === comment.commentId
                                                ? "삭제 중..."
                                                : "삭제"}
                                        </button>
                                    </div>
                                )}

                                {editingCommentId !== comment.commentId && (
                                    <small>
                                        {comment.createdAt
                                            ? new Date(
                                                comment.createdAt,
                                            ).toLocaleDateString("ko-KR")
                                            : ""}
                                    </small>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <form
                className="community-comment-form"
                onSubmit={handleSubmit}
            >
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="댓글을 작성해주세요."
                    disabled={isSubmitting}
                />

                <button
                    type="submit"
                    className="button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "등록 중..." : "댓글 작성"}
                </button>
            </form>

            {writeError && <p role="alert">{writeError}</p>}
        </section>
    );
}
