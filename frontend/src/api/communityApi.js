import { client } from "../auth/api/client.js";

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