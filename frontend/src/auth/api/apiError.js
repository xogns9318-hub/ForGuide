// 서버 실패 응답 { success: false, error: { code, message } }을 화면에서 구분하기 위한 오류
// code: 서버가 정한 오류 코드 (예: TOKEN_EXPIRED, LOGIN_FAILED)
// status: HTTP 상태 코드 (네트워크 오류는 0)
// fieldErrors: 입력 항목별 오류 안내 (예: { email: "이미 가입된 이메일입니다." })
export class ApiError extends Error {
    constructor(code, message, { status = 0, fieldErrors = {} } = {}) {
        super(message);
        this.name = "ApiError";
        this.code = code;
        this.status = status;
        this.fieldErrors = fieldErrors;
    }
}
