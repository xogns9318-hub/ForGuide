import { client } from "./client.js";

// 커서 기반 목록 API들이 공통으로 쓰는 기본 쿼리 파라미터를 만든다.
function createCursorParams({
    cursorCreatedAt = null,
    cursorId = null,
    cursorIdName,
    size = 10,
} = {}) {
    const params = new URLSearchParams();

    params.set("size", String(size));

    // 첫 페이지에서는 커서를 보내지 않는다.
    if (cursorCreatedAt != null && cursorId != null) {
        params.set("cursorCreatedAt", cursorCreatedAt);
        params.set(cursorIdName, String(cursorId));
    }

    return params;
}

// 게시글 목록 API들이 공통으로 쓰는 커서 쿼리 파라미터를 만든다.
function createPostCursorParams({
    cursorCreatedAt = null,
    cursorPostId = null,
    category = null,
    keyword = null,
    topic = null,
    size = 10,
} = {}) {
    const params = createCursorParams({
        cursorCreatedAt,
        cursorId: cursorPostId,
        cursorIdName: "cursorPostId",
        size,
    });

    if (category) params.set("category", category);
    if (keyword?.trim()) params.set("keyword", keyword.trim());
    if (topic) params.set("topic", topic);

    return params;
}

// Spring Boot에서 실제 게시글 목록을 가져온다.
export async function getCommunityPosts() {
    return client.get("/community/posts");
}

// 게시글 작성, 필터 화면에서 사용할 활성 카테고리 목록 조회
export async function getCommunityCategories() {
    return client.get("/community/options/categories");
}

// 게시글 필터 화면에서 사용할 활성 주요 주제 목록 조회
export async function getCommunityTopics() {
    return client.get("/community/options/topics");
}

// 선택한 카테고리에 연결된 활성 관련 서비스 목록 조회
export async function getCommunityRelatedServices(categoryCode) {
    return client.get(`/community/options/categories/${categoryCode}/related-services`);
}

// 게시글 상세 화면을 열 때 사용한다.
// 이 요청에서만 서버가 24시간 중복 규칙으로 조회수를 집계한다.
export async function getCommunityPost(postId) {
    return client.get(`/community/posts/${postId}`);
}

// 공개 게시글을 현재 선택 언어로 번역한다.
// 원문은 postId를 통해 서버가 직접 조회한다.
export async function translateCommunityPost(postId, targetLanguage) {
    return client.post(`/community/posts/${postId}/translation`, { targetLanguage });
}

// 무한 스크롤에 사용할 게시글 목록을 가져온다.
// 첫 요청에는 커서 없이 size만 보내고, 다음 요청부터 마지막 게시글
// 작성 시간과 번호를 함께 보내자
export async function getCommunityPostsByCursor({
    cursorCreatedAt = null,
    cursorPostId = null,
    category = null,
    keyword = null,
    topic = null,
    size = 10,
} = {}) {
    //URLSearchParams는 쿼리 파라미터를 안전하게 구성하고 인코딩
    const params = createPostCursorParams({
        cursorCreatedAt,
        cursorPostId,
        category,
        keyword,
        topic,
        size,
    });

    return client.get(`/community/posts/scroll?${params.toString()}`);
}

// 선택한 공감순 또는 조회순으로 정렬한 인기 게시글 목록
export async function getPopularCommunityPosts(sort = "likes") {
    const params = new URLSearchParams();
    params.set("sort", sort);

    return client.get(`/community/posts/popular?${params.toString()}`);
}

export async function createCommunityPost(postData) {
    // 공통 API 클라이언트를 통해 게시글 작성요청 보냄.
    // client.js에서 /api/v1 주소와 로그인 토큰을 처리한다.
    return client.post("/community/posts", postData);
}

//로그인한 작성자가 자신의 게시글 삭제.
export async function deleteCommunityPost(postId) {
    return client.delete(`/community/posts/${postId}`);
}

// 게시글 본문과 사진을 multipart/form-data로 수정
export async function updateCommunityPost(postId, formData) {
    return client.patch(`/community/posts/${postId}`, formData);
}

// 게시글의 댓글 목록 조회
export async function getCommunityComments(
    postId,
    { cursorCreatedAt = null, cursorCommentId = null, size = 10 } = {},
) {
    const params = createCursorParams({
        cursorCreatedAt,
        cursorId: cursorCommentId,
        cursorIdName: "cursorCommentId",
        size,
    });

    return client.get(`/community/posts/${postId}/comments?${params.toString()}`);
}

// 공개 댓글을 현재 선택 언어로 번역한다.
// 댓글 원문은 postID,commentId를 이용해 서버가 직접 조회한다.
export async function translateCommunityComment(postId, commentId, targetLanguage) {
    return client.post(`/community/posts/${postId}/comments/${commentId}/translation`, {
        targetLanguage,
    });
}

// 로그인한 사용자의 댓글·답글 작성. parentCommentId가 없으면 일반 댓글이다.
export async function createCommunityComment(
    postId,
    content,
    parentCommentId = null,
    mentionLoginId = null,
) {
    return client.post(`/community/posts/${postId}/comments`, {
        content,
        parentCommentId,
        mentionLoginId,
    });
}

// 댓글 작성자 본인의 댓글 수정
export async function updateCommunityComment(postId, commentId, content) {
    return client.patch(`/community/posts/${postId}/comments/${commentId}`, {
        content,
    });
}

// 댓글 작성자 또는 게시글 작성자의 댓글 삭제
export async function deleteCommunityComment(postId, commentId) {
    return client.delete(`/community/posts/${postId}/comments/${commentId}`);
}

// 로그인 회원의 댓글 공감 추가
export async function likeCommunityComment(postId, commentId) {
    return client.post(`/community/posts/${postId}/comments/${commentId}/likes`);
}

// 로그인 회원의 댓글 공감 취소
export async function unlikeCommunityComment(postId, commentId) {
    return client.delete(`/community/posts/${postId}/comments/${commentId}/likes`);
}

// 게시글의 좋아요 수와 현재 로그인 회원의 좋아요 여부 조회
export async function getCommunityPostLike(postId) {
    return client.get(`/community/posts/${postId}/likes`);
}

// 로그인 회원의 좋아요 추가
export async function likeCommunityPost(postId) {
    return client.post(`/community/posts/${postId}/likes`);
}

// 로그인 회원의 좋아요 취소
export async function unlikeCommunityPost(postId) {
    return client.delete(`/community/posts/${postId}/likes`);
}

// 게시글·댓글 작성자의 프로필 미리보기 정보 조회
export async function getCommunityMemberPreview(memberId) {
    return client.get(`/community/members/${memberId}/preview`);
}

// 프로필 미리보기에서 특정 회원의 작성글을 커서 방식으로 조회한다.
export async function getCommunityMemberPosts(
    memberId,
    { cursorCreatedAt = null, cursorPostId = null, size = 10 } = {},
) {
    const params = createPostCursorParams({
        cursorCreatedAt,
        cursorPostId,
        size,
    });

    return client.get(`/community/members/${memberId}/posts?${params.toString()}`);
}

// 게시글의 리포스트 수와 현재 로그인 회원의 리포스트 여부 조회
export async function getCommunityPostRepost(postId) {
    return client.get(`/community/posts/${postId}/reposts`);
}

// 로그인 회원의 리포스트 추가
export async function repostCommunityPost(postId) {
    return client.post(`/community/posts/${postId}/reposts`);
}

// 로그인 회원의 리포스트 취소
export async function unrepostCommunityPost(postId) {
    return client.delete(`/community/posts/${postId}/reposts`);
}

// 로그인 회원이 리포스트한 원본 게시글 목록 조회
export async function getMyRepostedCommunityPosts() {
    return client.get("/community/my-reposts");
}
