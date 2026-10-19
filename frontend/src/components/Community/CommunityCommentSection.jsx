import { useEffect, useMemo, useState } from "react";
import {
    createCommunityComment,
    deleteCommunityComment,
    getCommunityComments,
    updateCommunityComment,
} from "../../api/communityApi.js";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import { useNavigate } from "react-router-dom";
import CommunityMemberPreview from "./CommunityMemberPreview.jsx";

// 서버가 반환한 평면 댓글 목록을 부모-답글 순서의 화면 목록으로 바꾼다.
function buildCommentRows(comments) {
    const nodesById = new Map(comments.map((comment) => [
        comment.commentId,
        { comment, children: [] },
    ]));
    const roots = [];

    comments.forEach((comment) => {
        const parent = nodesById.get(comment.parentCommentId);
        const node = nodesById.get(comment.commentId);
        if (parent) parent.children.push(node);
        else roots.push(node);
    });

    const rows = [];
    function visit(node, depth) {
        rows.push({ comment: node.comment, depth });
        node.children.forEach((child) => visit(child, depth + 1));
    }
    roots.forEach((root) => visit(root, 0));
    return rows;
}

// 게시글 하나에 연결되는 댓글·답글 목록과 일반 댓글 작성 영역
export default function CommunityCommentSection({ postId, postMemberId, onCommentCountChange }) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);
    const [replyContent, setReplyContent] = useState("");
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
    const commentRows = useMemo(() => buildCommentRows(comments), [comments]);

    // 댓글·답글 작성 뒤에도 재사용해 목록과 게시글의 댓글 수를 즉시 최신 상태로 맞춘다.
    async function loadComments() {
        setIsLoading(true);
        setError("");
        try {
            const nextComments = await getCommunityComments(postId);
            setComments(nextComments);
            onCommentCountChange?.(postId, nextComments.length);
        } catch (requestError) {
            setError(requestError.message || "댓글을 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadComments();
    }, [postId]);

    function validateCommentContent(value) {
        const trimmedContent = value.trim();
        if (!trimmedContent) {
            setWriteError("댓글 내용을 입력해주세요.");
            return null;
        }
        if (trimmedContent.length > 1000) {
            setWriteError("댓글은 1000자 이하여야 합니다.");
            return null;
        }
        return trimmedContent;
    }

    async function submitComment(value, parentCommentId = null) {
        const trimmedContent = validateCommentContent(value);
        if (!trimmedContent) return false;

        if (!accessToken) {
            setWriteError("댓글을 작성하려면 로그인이 필요합니다.");
            navigate("/login");
            return false;
        }
        if (isSubmitting) return false;

        setIsSubmitting(true);
        setWriteError("");
        try {
            await createCommunityComment(postId, trimmedContent, parentCommentId);
            await loadComments();
            return true;
        } catch (requestError) {
            setWriteError(requestError.message || "댓글을 저장하지 못했습니다.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (await submitComment(content)) setContent("");
    }

    function openReply(commentId) {
        if (!accessToken) {
            navigate("/login");
            return;
        }
        setReplyingToCommentId(commentId);
        setReplyContent("");
        setWriteError("");
    }

    async function handleReplySubmit(event, parentCommentId) {
        event.preventDefault();
        if (await submitComment(replyContent, parentCommentId)) {
            setReplyingToCommentId(null);
            setReplyContent("");
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
        const trimmedContent = validateCommentContent(editingContent);
        if (!trimmedContent) return;

        setIsSubmitting(true);
        setWriteError("");
        try {
            await updateCommunityComment(postId, commentId, trimmedContent);
            setEditingCommentId(null);
            setEditingContent("");
            await loadComments();
        } catch (requestError) {
            setWriteError(requestError.message || "댓글을 수정하지 못했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(commentId) {
        if (!window.confirm("이 댓글을 삭제할까요?")) return;

        setDeletingCommentId(commentId);
        setWriteError("");
        try {
            await deleteCommunityComment(postId, commentId);
            setEditingCommentId(null);
            setReplyingToCommentId((currentId) => currentId === commentId ? null : currentId);
            // 삭제된 댓글의 자식 유무에 따라 서버 결과가 달라질 수 있어 전체 목록을 다시 맞춘다.
            await loadComments();
        } catch (requestError) {
            setWriteError(requestError.message || "댓글을 삭제하지 못했습니다.");
        } finally {
            setDeletingCommentId(null);
        }
    }

    return (
        <section className="community-comments">
            <h3>댓글</h3>
            {isLoading && <p>댓글을 불러오는 중입니다.</p>}
            {!isLoading && error && <p role="alert">{error}</p>}
            {!isLoading && !error && comments.length === 0 && <p>아직 댓글이 없습니다.</p>}

            {!isLoading && !error && comments.length > 0 && (
                <ul className="community-comment-list">
                    {commentRows.map(({ comment, depth }) => {
                        const isCommentAuthor = comment.memberId === member?.memberId;
                        const canDelete = isCommentAuthor || postMemberId === member?.memberId;
                        const isEditing = editingCommentId === comment.commentId;
                        const isReplying = replyingToCommentId === comment.commentId;

                        return (
                            <li
                                key={comment.commentId}
                                className="community-comment-item"
                                style={{ "--comment-depth": Math.min(depth, 3) }}
                            >
                                {!comment.deleted && (
                                    <CommunityMemberPreview
                                        memberId={comment.memberId}
                                        imageUrl={comment.profileImageUrl}
                                        nickname={comment.nickname}
                                        size={30}
                                    />
                                )}
                                <div className="community-comment-body">
                                    {comment.deleted ? (
                                        <p className="community-comment-deleted">삭제된 댓글입니다.</p>
                                    ) : (
                                        <>
                                            <strong>{comment.nickname}</strong>
                                            {isEditing ? (
                                                <form className="community-comment-edit-form" onSubmit={(event) => handleUpdate(event, comment.commentId)}>
                                                    <textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} maxLength={1000} rows={3} disabled={isSubmitting} />
                                                    <div>
                                                        <button type="submit" disabled={isSubmitting}>수정</button>
                                                        <button type="button" onClick={cancelEditing} disabled={isSubmitting}>취소</button>
                                                        <button type="button" onClick={() => handleDelete(comment.commentId)} disabled={deletingCommentId === comment.commentId}>
                                                            {deletingCommentId === comment.commentId ? "삭제 중" : "삭제"}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : <p>{comment.content}</p>}
                                        </>
                                    )}

                                    {!comment.deleted && !isEditing && (
                                        <div className="community-comment-actions">
                                            <button type="button" onClick={() => openReply(comment.commentId)}>댓글</button>
                                            {isCommentAuthor && <button type="button" onClick={() => startEditing(comment)} disabled={isSubmitting}>수정</button>}
                                            {canDelete && (
                                                <button type="button" onClick={() => handleDelete(comment.commentId)} disabled={deletingCommentId === comment.commentId}>
                                                    {deletingCommentId === comment.commentId ? "삭제 중" : "삭제"}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {isReplying && (
                                        <form className="community-reply-form" onSubmit={(event) => handleReplySubmit(event, comment.commentId)}>
                                            <textarea
                                                value={replyContent}
                                                onChange={(event) => setReplyContent(event.target.value)}
                                                maxLength={1000}
                                                rows={2}
                                                placeholder={`${comment.nickname}님에게 댓글 작성`}
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                            <div>
                                                <button type="submit" disabled={isSubmitting}>등록</button>
                                                <button type="button" onClick={() => setReplyingToCommentId(null)} disabled={isSubmitting}>취소</button>
                                            </div>
                                        </form>
                                    )}

                                    {!isEditing && <small>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString("ko-KR") : ""}</small>}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* 일반 댓글은 목록 아래의 별도 입력창에서 작성한다. */}
            <form className="community-comment-form" onSubmit={handleSubmit}>
                <textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={1000} rows={3} placeholder="댓글을 작성해주세요." disabled={isSubmitting} />
                <button type="submit" className="button" disabled={isSubmitting}>{isSubmitting ? "등록 중" : "댓글 작성"}</button>
            </form>
            {writeError && <p role="alert">{writeError}</p>}
        </section>
    );
}
