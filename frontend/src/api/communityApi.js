import { client } from "./client.js";

// Spring Boot에서 실제 게시글 목록을 가져온다.
export async function getCommunityPosts() {
    return client.get("/community/posts");
}

// 무한 스크롤에 사용할 게시글 목록을 가져온다.
// 첫 요청에는 커서 없이 size만 보내고, 다음 요청부터 마지막 게시글
// 작성 시간과 번호를 함께 보내자
export async function getCommunityPostsByCursor({
    cursorCreatedAt = null,
    cursorPostId = null,
    size = 10,
} = {}) {

    //URLSearchParams는 쿼리 파라미터를 안전하게 구성하고 인코딩
    const params = new URLSearchParams();
    params.set("size", String(size));

    // 첫 페이지에서는 커서가 없으므로 두 값을 모두 전달하지 않음
    if (cursorCreatedAt != null && cursorPostId != null) {
        params.set("cursorCreatedAt", cursorCreatedAt);
        params.set("cursorPostId", String(cursorPostId));
    }

    return client.get(`/community/posts/scroll?${params.toString()}`);
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
export async function getCommunityComments(postId) {
    return client.get(`/community/posts/${postId}/comments`);
}

// 로그인한 사용자의 댓글·답글 작성. parentCommentId가 없으면 일반 댓글이다.
export async function createCommunityComment(postId, content, parentCommentId = null) {
    return client.post(`/community/posts/${postId}/comments`, {
        content,
        parentCommentId,
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
