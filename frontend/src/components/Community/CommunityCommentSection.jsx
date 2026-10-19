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
import { useTranslation } from "react-i18next";

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
    function visit(node, depth, threadRoot) {
        // 답글을 다시 눌러도 화면에서는 한 단계까지만 들여쓴다.
        rows.push({
            comment: node.comment,
            depth: Math.min(depth, 1),
            threadRoot,
        });
        node.children.forEach((child) => visit(child, depth + 1, threadRoot));
    }
    roots.forEach((root) => visit(root, 0, root.comment));
    return rows;
}

// 게시글 하나에 연결되는 댓글·답글 목록과 일반 댓글 작성 영역
export default function CommunityCommentSection({ postId, postMemberId, onCommentCountChange }) {
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState("");
    const [replyTarget, setReplyTarget] = useState(null);
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
    const { t } = useTranslation();
    const commentRows = useMemo(() => buildCommentRows(comments), [comments]);

    // 댓글·답글 작성 뒤에도 재사용해 목록과 게시글의 댓글 수를 즉시 최신 상태로 맞춘다.
    async function loadComments() {
        setIsLoading(true);
        setError("");
        try {
            const nextComments = await getCommunityComments(postId);
            // 서버의 삭제 기록은 보존하되, 화면 목록과 댓글 수에는 포함하지 않는다.
            const visibleComments = nextComments.filter((comment) => !comment.deleted);
            setComments(visibleComments);
            onCommentCountChange?.(postId, visibleComments.length);
        } catch (requestError) {
            setError(requestError.message || t("community.comments.loadError"));
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
            setWriteError(t("community.comments.contentRequired"));
            return null;
        }
        if (trimmedContent.length > 1000) {
            setWriteError(t("community.comments.maxLength"));
            return null;
        }
        return trimmedContent;
    }

    async function submitComment(value, parentCommentId = null) {
        const trimmedContent = validateCommentContent(value);
        if (!trimmedContent) return false;

        if (!accessToken) {
            setWriteError(t("community.comments.loginRequired"));
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
            setWriteError(
                requestError.message
                || t("community.comments.saveError"),
            );
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (await submitComment(content)) setContent("");
    }

    function openReply(comment, threadRoot) {
        if (!accessToken) {
            navigate("/login");
            return;
        }

        // 답글의 댓글도 최상위 댓글에 연결해 두 단계 이상 깊어지지 않게 한다.
        setReplyTarget({
            commentId: comment.commentId,
            parentCommentId: threadRoot.deleted
                ? comment.commentId
                : threadRoot.commentId,
        });
        setReplyContent(`@${comment.nickname} `);
        setWriteError("");
    }

    async function handleReplySubmit(event) {
        event.preventDefault();
        if (await submitComment(replyContent, replyTarget?.parentCommentId)) {
            setReplyTarget(null);
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
            setWriteError(requestError.message || t("community.comments.updateError"));
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDelete(commentId) {
        if (!window.confirm(t("community.comments.deleteConfirm"))) return;
        setDeletingCommentId(commentId);
        setWriteError("");
        try {
            await deleteCommunityComment(postId, commentId);
            setEditingCommentId(null);
            setReplyTarget((current) => (
                current?.commentId === commentId ? null : current
            ));
            // 삭제 성공 직후 목록과 상단의 댓글 수를 바로 줄인다.
            setComments((previousComments) => {
                const nextComments = previousComments.filter(
                    (comment) => comment.commentId !== commentId,
                );
                onCommentCountChange?.(postId, nextComments.length);
                return nextComments;
            });
        } catch (requestError) {
            setWriteError(requestError.message || t("community.comments.deleteError"));
        } finally {
            setDeletingCommentId(null);
        }
    }

    return (
        <section className="community-comments">
            <h3>{t("community.comments.title")}</h3>
            {isLoading && <p>{t("community.comments.loading")}</p>}
            {!isLoading && error && <p role="alert">{error}</p>}
            {!isLoading && !error && comments.length === 0 && (
                <p>{t("community.comments.empty")}</p>
            )}
            {!isLoading && !error && comments.length > 0 && (
                <ul className="community-comment-list">
                    {commentRows.map(({ comment, depth, threadRoot }) => {
                        const isCommentAuthor = comment.memberId === member?.memberId;
                        const canDelete = isCommentAuthor || postMemberId === member?.memberId;
                        const isEditing = editingCommentId === comment.commentId;
                        const isReplying = replyTarget?.commentId === comment.commentId;

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
                                        <p className="community-comment-deleted">
                                            {t("community.comments.deleted")}
                                        </p>
                                    ) : (
                                        <>
                                            <strong>{comment.nickname}</strong>
                                            {isEditing ? (
                                                <form
                                                    className="community-comment-edit-form"
                                                    onSubmit={(event) => handleUpdate(event, comment.commentId)}
                                                >
                                                    <textarea
                                                        value={editingContent}
                                                        onChange={(event) => setEditingContent(event.target.value)}
                                                        maxLength={1000}
                                                        rows={3}
                                                        disabled={isSubmitting}
                                                    />
                                                    <div>
                                                        <button type="submit" disabled={isSubmitting}>
                                                            {t("community.comments.edit")}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelEditing}
                                                            disabled={isSubmitting}
                                                        >
                                                            {t("community.comments.cancel")}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(comment.commentId)}
                                                            disabled={deletingCommentId === comment.commentId}
                                                        >
                                                            {deletingCommentId === comment.commentId
                                                                ? t("community.comments.deleting")
                                                                : t("community.comments.delete")}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <p>{comment.content}</p>
                                            )}
                                        </>
                                    )}

                                    {!comment.deleted && !isEditing && (
                                        <div className="community-comment-actions">
                                            <button
                                                type="button"
                                                onClick={() => openReply(comment, threadRoot)}
                                            >
                                                {t("community.comments.reply")}
                                            </button>

                                            {isCommentAuthor && (
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(comment)}
                                                    disabled={isSubmitting}
                                                >
                                                    {t("community.comments.edit")}
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(comment.commentId)}
                                                    disabled={deletingCommentId === comment.commentId}
                                                >
                                                    {deletingCommentId === comment.commentId
                                                        ? t("community.comments.deleting")
                                                        : t("community.comments.delete")}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {isReplying && (
                                        <form
                                            className="community-reply-form"
                                            onSubmit={handleReplySubmit}
                                        >
                                            <textarea
                                                value={replyContent}
                                                onChange={(event) => setReplyContent(event.target.value)}
                                                maxLength={1000}
                                                rows={2}
                                                placeholder={t("community.comments.replyPlaceholder", {
                                                    nickname: comment.nickname,
                                                })}
                                                disabled={isSubmitting}
                                                autoFocus
                                            />
                                            <div>
                                                <button type="submit" disabled={isSubmitting}>
                                                    {t("community.comments.submit")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyTarget(null)}
                                                    disabled={isSubmitting}
                                                >
                                                    {t("community.comments.cancel")}
                                                </button>
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
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder={t("community.comments.writePlaceholder")}
                    disabled={isSubmitting}
                />
                <button type="submit" className="button" disabled={isSubmitting}>
                    {isSubmitting
                        ? t("community.comments.submitting")
                        : t("community.comments.writeButton")}
                </button>
            </form>
            {writeError && <p role="alert">{writeError}</p>}
        </section>
    );
}
