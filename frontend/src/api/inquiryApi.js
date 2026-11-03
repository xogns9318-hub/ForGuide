import { client } from "./client.js";

// 로그인한 사용자가 문의를 등록한다.
export function createInquiry({ inquiryCategory, title, content }) {
    return client.post("/inquiries", {
        inquiryCategory,
        title,
        content,
    });
}

// 로그인한 사용자의 문의를 최신 순으로 커서 조회한다.
export function getMyInquiries({ cursorInquiryId = null, size = 10 } = {}) {
    const params = new URLSearchParams();

    params.set("size", String(size));

    if (cursorInquiryId != null) {
        params.set("cursorInquiryId", String(cursorInquiryId));
    }

    return client.get(`/inquiries?${params.toString()}`);
}

// 문의 상세를 열 때도 서버가 로그인한 회원의 소유권을 검증한다.
export function getMyInquiry(inquiryId) {
    return client.get(`/inquiries/${inquiryId}`);
}
