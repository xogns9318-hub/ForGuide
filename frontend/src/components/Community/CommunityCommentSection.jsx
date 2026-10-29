import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    createCommunityComment,
    deleteCommunityComment,
    getCommunityComments,
    likeCommunityComment,
    unlikeCommunityComment,
    updateCommunityComment,
    translateCommunityComment,
} from "../../api/communityApi.js";
import { useAuthStore } from "../../auth/store/useAuthStore.js";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll.js";
import { useLocation, useNavigate } from "react-router-dom";
import CommunityMemberPreview from "./CommunityMemberPreview.jsx";
import { useTranslation } from "react-i18next";
import { confirm } from "../Modal/modal.js";

const COMMENT_PAGE_SIZE = 10;

// 서버가 반환한 평면 댓글 목록을 부모-답글 순서의 화면 목록으로 바꾼다.
function buildCommentRows(comments) {
    const nodesById = new Map(
        comments.map((comment) => [comment.commentId, { comment, children: [] }]),
    );
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
    const [hasMore, setHasMore] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [likingCommentId, setLikingCommentId] = useState(null);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState("");
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [error, setError] = useState("");
    const [writeError, setWriteError] = useState("");
    const [commentTranslations, setCommentTranslations] = useState({});
    const [visibleTranslationIds, setVisibleTranslationIds] = useState(new Set());
    const [translatingCommentId, setTranslatingCommentId] = useState(null);
    const [translationErrors, setTranslationErrors] = useState({});
    const replyTextareaRef = useRef(null);
    const loadingRef = useRef(false);
    const cursorCreatedAtRef = useRef(null);
    const cursorCommentIdRef = useRef(null);
    const hasMoreRef = useRef(true);
    const requestVersionRef = useRef(0);

    const accessToken = useAuthStore((state) => state.accessToken);
    const member = useAuthStore((state) => state.member);
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const targetLanguage = i18n.resolvedLanguage || i18n.language || "ko";
    const commentRows = useMemo(() => buildCommentRows(comments), [comments]);
    const commentCountChangeRef = useRef(onCommentCountChange);

    useEffect(() => {
        commentCountChangeRef.current = onCommentCountChange;
    }, [onCommentCountChange]);

    function moveToLogin() {
        const next = `${location.pathname}${location.search}${location.hash}`;

        navigate(`/login?next=${encodeURIComponent(next)}`);
    }

    // 다음 댓글 페이지를 추가한다. 답글은 서버에서 같은 부모 댓글 묶음으로 함께 받는다.
    const loadMoreComments = useCallback(
        async (requestVersion = requestVersionRef.current) => {
            if (loadingRef.current || !hasMoreRef.current) {
                return;
            }

            loadingRef.current = true;
            setIsLoading(true);
            setError("");

            try {
                const receivedComments = await getCommunityComments(postId, {
                    cursorCreatedAt: cursorCreatedAtRef.current,
                    cursorCommentId: cursorCommentIdRef.current,
                    size: COMMENT_PAGE_SIZE,
                });

                // 다른 게시글로 이동한 뒤 이전 요청이 늦게 끝난 경우 결과를 버린다.
                if (requestVersion !== requestVersionRef.current) {
                    return;
                }

                const nextComments = Array.isArray(receivedComments)
                    ? receivedComments
                    : [];

                // 삭제된 부모 댓글도 답글의 연결 구조를 유지하기 위해 목록에 남긴다.
                setComments((previousComments) => {
                    const commentIds = new Set(
                        previousComments.map((comment) => comment.commentId),
                    );
                    const mergedComments = [
                        ...previousComments,
                        ...nextComments.filter(
                            (comment) => !commentIds.has(comment.commentId),
                        ),
                    ];

                    // 삭제 표시 댓글은 화면 구조에는 남기되 게시글 댓글 수에는 포함하지 않는다.
                    const visibleCommentCount = mergedComments.filter(
                        (comment) => !comment.deleted,
                    ).length;
                    commentCountChangeRef.current?.(
                        postId,
                        visibleCommentCount,
                    );

                    return mergedComments;
                });

                // 답글이 아니라 마지막 최상위 댓글을 다음 조회의 기준점으로 사용한다.
                const rootComments = nextComments.filter(
                    (comment) => comment.parentCommentId == null,
                );
                const lastRootComment = rootComments.at(-1);

                cursorCreatedAtRef.current =
                    lastRootComment?.createdAt ?? cursorCreatedAtRef.current;
                cursorCommentIdRef.current =
                    lastRootComment?.commentId ?? cursorCommentIdRef.current;

                const nextHasMore =
                    rootComments.length === COMMENT_PAGE_SIZE;
                hasMoreRef.current = nextHasMore;
                setHasMore(nextHasMore);
            } catch (requestError) {
                if (requestVersion === requestVersionRef.current) {
                    setError(
                        requestError.message
                        || t("community.comments.loadError"),
                    );
                }
            } finally {
                if (requestVersion === requestVersionRef.current) {
                    loadingRef.current = false;
                    setIsLoading(false);
                }
            }
        },
        [postId, t],
    );

// 작성·수정·삭제 뒤에는 첫 페이지부터 다시 읽어 최신 상태로 맞춘다.
    const loadComments = useCallback(async () => {
        requestVersionRef.current += 1;
        const requestVersion = requestVersionRef.current;

        loadingRef.current = false;
        cursorCreatedAtRef.current = null;
        cursorCommentIdRef.current = null;
        hasMoreRef.current = true;

        setComments([]);
        setHasMore(true);

        await loadMoreComments(requestVersion);
    }, [loadMoreComments]);

    useEffect(() => {
        loadComments();

        // 모달을 닫거나 다른 게시글을 열면 진행 중인 이전 요청 결과를 무시한다.
        return () => {
            requestVersionRef.current += 1;
        };
    }, [loadComments]);

    const observerTarget = useInfiniteScroll({
        enabled: hasMore && !isLoading && !error,
        onLoadMore: loadMoreComments,
    });

    function retryLoadMoreComments() {
        setError("");
        hasMoreRef.current = true;
        setHasMore(true);
        void loadMoreComments();
    }

    useEffect(() => {
        setCommentTranslations({});
        setVisibleTranslationIds(new Set());
        setTranslatingCommentId(null);
        setTranslationErrors({});
    }, [postId, targetLanguage]);

    useEffect(() => {
        if (!replyTarget || !replyTextareaRef.current) return;

        // 답글 폼이 열린 뒤 멘션 마지막 글자 바로 뒤에 커서를 놓는다.
        const cursorPosition = replyTextareaRef.current.value.length;
        replyTextareaRef.current.focus();
        replyTextareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }, [replyTarget]);

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

    function validateReplyContent(value) {
        const trimmedContent = value.trim();

        // @닉네임을 제외한 실제 답글 내용 있는지 검사
        const contentWithoutMention = trimmedContent.replace(/^@\S+\s*/, "").trim();

        if (!contentWithoutMention) {
            setWriteError(t("community.comments.contentRequired"));
            return null;
        }

        return trimmedContent;
    }

    async function submitComment(value, parentCommentId = null, mentionLoginId = null) {
        const trimmedContent = validateCommentContent(value);
        if (!trimmedContent) return false;

        if (!accessToken) {
            setWriteError(t("community.comments.loginRequired"));
            moveToLogin();
            return false;
        }
        if (isSubmitting) return false;

        setIsSubmitting(true);
        setWriteError("");
        try {
            await createCommunityComment(postId, trimmedContent, parentCommentId, mentionLoginId);
            await loadComments();
            return true;
        } catch (requestError) {
            setWriteError(requestError.message || t("community.comments.saveError"));
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (await submitComment(content)) {
            setContent("");
            setWriteError("");
        }
    }

    function openReply(comment) {
        if (!accessToken) {
            moveToLogin();
            return;
        }

        // 원댓글에만 답글을 연결해 대댓글이 더 깊어지지 않게 한다.
        setReplyTarget({
            commentId: comment.commentId,
            parentCommentId: comment.commentId,
        });
        // 답글 대상은 닉네임이 아닌 고유 로그인 아이디로 시작한다.
        setReplyContent(`@${comment.loginId} `);
        setWriteError("");
    }

    function closeReply() {
        setReplyTarget(null);
        setReplyContent("");
        setWriteError("");
    }

    async function handleReplySubmit(event) {
        event.preventDefault();

        const validReplyContent = validateReplyContent(replyContent);
        if (!validReplyContent) return;

        const mentionMatch = validReplyContent.match(/^@(\S+)\s+([\s\S]+)$/);
        const mentionLoginId = mentionMatch?.[1] ?? null;
        const replyText = mentionMatch?.[2]?.trim() ?? validReplyContent;

        if (await submitComment(replyText, replyTarget?.parentCommentId, mentionLoginId)) {
            closeReply();
        }
    }

    function handleReplyKeyDown(event) {
        const mentionPrefix = replyContent.match(/^@\S+\s+/)?.[0];
        const cursorAtMentionEnd =
            event.currentTarget.selectionStart === mentionPrefix?.length &&
            event.currentTarget.selectionEnd === mentionPrefix?.length;

        // 멘션 끝에서 Backspace를 한 번 누르면 @아이디와 뒤 공백을 한 번에 지운다.
        if (event.key === "Backspace" && mentionPrefix && cursorAtMentionEnd) {
            event.preventDefault();
            setReplyContent((previousContent) => previousContent.slice(mentionPrefix.length));
        }
    }

    async function handleCommentTranslation(commentId) {
        // 이미 열린 번역은 API 요청 없이 접기만 한다.
        if (visibleTranslationIds.has(commentId)) {
            setVisibleTranslationIds((previous) => {
                const next = new Set(previous);
                next.delete(commentId);
                return next;
            });
            return;
        }

        // 같은 댓글, 언어 조합은 현재 화면에 남아 있는 결과를 재사용한다.
        if (commentTranslations[commentId]) {
            setVisibleTranslationIds((previous) => new Set(previous).add(commentId));
            return;
        }

        setTranslatingCommentId(commentId);
        setTranslationErrors((previous) => ({
            ...previous,
            [commentId]: "",
        }));

        try {
            const response = await translateCommunityComment(postId, commentId, targetLanguage);

            setCommentTranslations((previous) => ({
                ...previous,
                [commentId]: response.translatedText,
            }));
            setVisibleTranslationIds((previous) => new Set(previous).add(commentId));
        } catch (requestError) {
            setTranslationErrors((previous) => ({
                ...previous,
                [commentId]: requestError.message || t("community.comments.translationError"),
            }));
        } finally {
            setTranslatingCommentId(null);
        }
    }

    async function handleCommentLike(comment) {
        if (!accessToken) {
            moveToLogin();
            return;
        }

        setLikingCommentId(comment.commentId);
        setWriteError("");
        try {
            const response = comment.likedByMe
                ? await unlikeCommunityComment(postId, comment.commentId)
                : await likeCommunityComment(postId, comment.commentId);

            // 서버가 돌려준 수치로 해당 댓글의 공감 상태만 즉시 갱신한다.
            setComments((previousComments) =>
                previousComments.map((previousComment) =>
                    previousComment.commentId === comment.commentId
                        ? {
                              ...previousComment,
                              likeCount: response.likeCount,
                              likedByMe: response.likedByMe,
                          }
                        : previousComment,
                ),
            );
        } catch (requestError) {
            setWriteError(requestError.message || t("community.comments.likeError"));
        } finally {
            setLikingCommentId(null);
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
        if (!(await confirm(t("community.comments.deleteConfirm")))) return;
        setDeletingCommentId(commentId);
        setWriteError("");
        try {
            await deleteCommunityComment(postId, commentId);
            setEditingCommentId(null);
            setReplyTarget((current) => (current?.commentId === commentId ? null : current));
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
                    {commentRows.map(({ comment, depth }) => {
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
                                        loginId={comment.loginId}
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
                                            <strong>{comment.loginId}</strong>
                                            {isEditing ? (
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
                                                            onClick={() =>
                                                                handleDelete(comment.commentId)
                                                            }
                                                            disabled={
                                                                deletingCommentId ===
                                                                comment.commentId
                                                            }
                                                        >
                                                            {deletingCommentId === comment.commentId
                                                                ? t("community.comments.deleting")
                                                                : t("community.comments.delete")}
                                                        </button>
                                                    </div>
                                                </form>
                                            ) : comment.mentionedMemberId ? (
                                                <div className="community-comment-text">
                                                    <CommunityMemberPreview
                                                        memberId={comment.mentionedMemberId}
                                                        imageUrl={comment.mentionedProfileImageUrl}
                                                        loginId={comment.mentionedLoginId}
                                                        nickname={comment.mentionedLoginId}
                                                        variant="mention"
                                                    />{" "}
                                                    {comment.content}
                                                </div>
                                            ) : (
                                                <p>{comment.content}</p>
                                            )}
                                        </>
                                    )}

                                    {!comment.deleted && !isEditing && (
                                        <div className="community-comment-actions">
                                            <button
                                                type="button"
                                                className="community-comment-translation-button"
                                                onClick={() =>
                                                    handleCommentTranslation(comment.commentId)
                                                }
                                                disabled={
                                                    translatingCommentId === comment.commentId
                                                }
                                            >
                                                {translatingCommentId === comment.commentId
                                                    ? t("community.comments.translating")
                                                    : visibleTranslationIds.has(comment.commentId)
                                                      ? t("community.comments.hideTranslation")
                                                      : t("community.comments.showTranslation")}
                                            </button>
                                            <button
                                                type="button"
                                                className="community-comment-like-button"
                                                onClick={() => handleCommentLike(comment)}
                                                disabled={likingCommentId === comment.commentId}
                                                aria-pressed={comment.likedByMe}
                                            >
                                                <span aria-hidden="true">
                                                    {comment.likedByMe ? "♥" : "♡"}
                                                </span>{" "}
                                                {t("community.comments.like")}{" "}
                                                {comment.likeCount ?? 0}
                                            </button>

                                            {comment.parentCommentId == null && (
                                                <button
                                                    type="button"
                                                    className="community-comment-reply-button"
                                                    onClick={() => openReply(comment)}
                                                >
                                                    {t("community.comments.reply")}
                                                </button>
                                            )}

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
                                                    disabled={
                                                        deletingCommentId === comment.commentId
                                                    }
                                                >
                                                    {deletingCommentId === comment.commentId
                                                        ? t("community.comments.deleting")
                                                        : t("community.comments.delete")}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {!comment.deleted &&
                                        !isEditing &&
                                        translationErrors[comment.commentId] && (
                                            <p
                                                className="community-comment-translation-error"
                                                role="alert"
                                            >
                                                {translationErrors[comment.commentId]}
                                            </p>
                                        )}

                                    {!comment.deleted &&
                                        !isEditing &&
                                        visibleTranslationIds.has(comment.commentId) &&
                                        commentTranslations[comment.commentId] && (
                                            <div className="community-comment-translation-result">
                                                <p className="community-comment-translation-label">
                                                    {t("community.comments.aiTranslation")}
                                                </p>
                                                <p className="community-comment-translation-text">
                                                    {commentTranslations[comment.commentId]}
                                                </p>
                                            </div>
                                        )}

                                    {isReplying && (
                                        <form
                                            className="community-reply-form"
                                            onSubmit={handleReplySubmit}
                                        >
                                            <textarea
                                                ref={replyTextareaRef}
                                                value={replyContent}
                                                onChange={(event) => {
                                                    setReplyContent(event.target.value);
                                                    setWriteError("");
                                                }}
                                                onKeyDown={handleReplyKeyDown}
                                                maxLength={1000}
                                                rows={2}
                                                placeholder={t(
                                                    "community.comments.writePlaceholder",
                                                )}
                                                disabled={isSubmitting}
                                            />
                                            <div>
                                                <button type="submit" disabled={isSubmitting}>
                                                    {t("community.comments.submit")}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={closeReply}
                                                    disabled={isSubmitting}
                                                >
                                                    {t("community.comments.cancel")}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    {!isEditing && (
                                        <small>
                                            {comment.createdAt
                                                ? new Date(comment.createdAt).toLocaleDateString(
                                                      "ko-KR",
                                                  )
                                                : ""}
                                        </small>
                                    )}
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
                    onChange={(event) => {
                        setContent(event.target.value);
                        setWriteError("");
                    }}
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
