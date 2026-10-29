package com.example.forguide.common.exception;

import java.util.Map;

/**
 * <pre>
 * throw new ApiException(ErrorCode.LOGIN_FAILED);
 * throw new ApiException(ErrorCode.EMAIL_DUPLICATED, Map.of("email", "이미 가입된 이메일입니다."));
 * </pre>
 */
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Map<String, String> fieldErrors;

    public ApiException(ErrorCode errorCode) {
        this(errorCode, errorCode.getDefaultMessage(), Map.of());
    }

    /** 기본 문구 대신 상황에 맞는 문구를 쓸 때 */
    public ApiException(ErrorCode errorCode, String message) {
        this(errorCode, message, Map.of());
    }

    /** 입력 항목별 오류를 함께 보낼 때 (문구는 기본 문구) */
    public ApiException(ErrorCode errorCode, Map<String, String> fieldErrors) {
        this(errorCode, errorCode.getDefaultMessage(), fieldErrors);
    }

    public ApiException(ErrorCode errorCode, String message, Map<String, String> fieldErrors) {
        super(message);
        this.errorCode = errorCode;
        this.fieldErrors = fieldErrors == null ? Map.of() : Map.copyOf(fieldErrors);
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    /** 응답의 error.code 문자열 */
    public String getCode() {
        return errorCode.name();
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
