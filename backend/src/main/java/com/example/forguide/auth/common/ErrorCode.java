package com.example.forguide.auth.common;

import org.springframework.http.HttpStatus;

/**
 * 인증·회원(auth) 오류 코드 목록. 코드·HTTP 상태·기본 안내 문구를 이곳 한 곳에서 관리한다.
 * 프론트 auth는 code 문자열로 분기하므로, 이미 쓰는 이름은 바꾸지 않는다.
 */
public enum ErrorCode {

    // ── 공통 ──
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력 내용을 확인해주세요."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 정보를 찾을 수 없습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."),

    // ── 인증 (토큰) ──
    AUTH_REQUIRED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "로그인이 만료되었습니다."),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "로그인 정보가 올바르지 않습니다."),
    REFRESH_INVALID(HttpStatus.UNAUTHORIZED, "다시 로그인해주세요."),

    // 보안: 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않는다
    LOGIN_FAILED(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다."),

    // ── 회원 ──
    LOGIN_ID_DUPLICATED(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다."),
    EMAIL_DUPLICATED(HttpStatus.CONFLICT, "이미 가입된 이메일입니다."),
    INVALID_IMAGE(HttpStatus.BAD_REQUEST, "이미지는 JPG·PNG, 4MB 이하로 올려주세요.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
