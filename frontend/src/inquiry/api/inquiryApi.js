import { client } from "../../api/client.js";

// 로그인한 사용자가 문의와 선택한 이미지를 함께 등록한다.
export function createInquiry({ inquiryCategory, title, content, images = [] }) {
    const formData = new FormData();

    formData.append("inquiryCategory", inquiryCategory);
    formData.append("title", title);
    formData.append("content", content);

    images.forEach((image) => formData.append("images", image));

    return client.post("/inquiries", formData);
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

// 답변 전인 내 문의만 삭제할 수 있다.
export function deleteMyReceivedInquiry(inquiryId) {
    return client.delete(`/inquiries/${inquiryId}`);
}

export function translateMyInquiryText(inquiryId, field, targetLanguage) {
    return client.post(`/inquiries/${inquiryId}/translation/${field}`, { targetLanguage });
}
