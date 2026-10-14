import { client } from "../auth/api/client.js";

// Spring Boot에서 실제 게시글 목록을 가져온다.
export async function getCommunityPosts() {
    return client.get("/community/posts");
}
