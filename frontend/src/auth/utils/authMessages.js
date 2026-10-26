import { ApiError } from "../../api/apiError.js";

// 회원 화면의 안내·오류 문구를 번역 키로 다루기 위한 도구
// 검사 함수는 문구 대신 { key, values } 형태의 "메시지"를 돌려주고,
// 화면은 messageText(t, 메시지)로 현재 언어의 문구를 만든다.

// 번역 키로 된 메시지 만들기
export function msg(key, values) {
    return { key, values };
}

// 메시지 → 화면에 보일 문구
// - 빈 값: ""
// - 문자열: 이미 문구인 것(서버가 보낸 안내 등)은 그대로
// - { key, values }: 번역. values.itemKeys가 있으면 각 항목도 번역해 목록으로 이어 붙인다
export function messageText(t, message) {
    if (!message) return "";
    if (typeof message === "string") return message;

    const values = { ...message.values };
    if (Array.isArray(values.itemKeys)) {
        values.items = values.itemKeys
            .map((itemKey) => t(itemKey))
            .join(t("auth.validation.listSeparator"));
        delete values.itemKeys;
    }
    return t(message.key, values);
}

// 서버 오류 코드 중 회원 화면에서 번역 문구로 바꿔 보여 줄 것
// (목록에 없는 코드는 서버가 보낸 문구를 그대로 쓴다)
const KNOWN_ERROR_CODES = [
    "LOGIN_FAILED",
    "LOGIN_LOCKED",
    "LOGIN_ID_DUPLICATED",
    "EMAIL_DUPLICATED",
    "EMAIL_NOT_VERIFIED",
    "VERIFICATION_CODE_INVALID",
    "VERIFICATION_EXPIRED",
    "VERIFICATION_ATTEMPTS_EXCEEDED",
    "VERIFICATION_RESEND_TOO_SOON",
    "VERIFICATION_DAILY_LIMIT",
    "MAIL_SEND_FAILED",
    "INVALID_IMAGE",
    "AUTH_REQUIRED",
    "NETWORK_ERROR",
    "TIMEOUT",
];

// 서버 오류 → 폼 아래에 보일 메시지
// fallbackKey: 서버 문구도 없을 때 쓸 기본 안내의 번역 키
export function apiErrorMessage(error, fallbackKey) {
    if (error instanceof ApiError) {
        if (KNOWN_ERROR_CODES.includes(error.code)) {
            return msg(`auth.errors.${error.code}`);
        }
        if (error.message) return error.message;
    }
    return msg(fallbackKey);
}

// 서버 오류 → 입력 항목별 메시지 ({ email: 메시지, ... })
// 중복 오류는 번역 문구로 바꾸고, 그 밖의 항목 안내는 서버 문구를 그대로 쓴다
export function apiFieldErrors(error) {
    if (!(error instanceof ApiError)) return {};

    const known = KNOWN_ERROR_CODES.includes(error.code) ? msg(`auth.errors.${error.code}`) : null;

    return Object.fromEntries(
        Object.entries(error.fieldErrors ?? {}).map(([field, text]) => [field, known ?? text]),
    );
}
