package com.example.forguide.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Map;

/**
 * 모든 API의 공통 응답 형식. 프론트 src/api/client.js가 이 모양을 기준으로 응답을 해석한다.
 *
 * <pre>
 * 성공: { "success": true,  "data": { ... } }
 * 실패: { "success": false, "error": { "code": "LOGIN_FAILED", "message": "...", "fieldErrors": { ... } } }
 * </pre>
 *
 * 값이 없는 항목(성공 시 error, 실패 시 data, 비어 있는 fieldErrors)은 JSON에서 뺀다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(boolean success, T data, ErrorBody error) {

    /** 성공 응답 (돌려줄 데이터가 있을 때) */
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }

    /** 성공 응답 (돌려줄 데이터가 없을 때. 예: 로그아웃) */
    public static ApiResponse<Void> ok() {
        return new ApiResponse<>(true, null, null);
    }

    /** 실패 응답 */
    public static ApiResponse<Void> fail(String code, String message) {
        return fail(code, message, null);
    }

    /** 실패 응답 + 입력 항목별 오류 (예: { "email": "이미 가입된 이메일입니다." }) */
    public static ApiResponse<Void> fail(String code, String message, Map<String, String> fieldErrors) {
        Map<String, String> errors = (fieldErrors == null || fieldErrors.isEmpty()) ? null : fieldErrors;
        return new ApiResponse<>(false, null, new ErrorBody(code, message, errors));
    }

    /** 실패 내용. code는 프론트가 분기에 쓰고(예: TOKEN_EXPIRED → 재발급), message는 화면에 보여 준다 */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorBody(String code, String message, Map<String, String> fieldErrors) {
    }
}
