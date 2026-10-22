package com.example.forguide.consultation.institution.controller;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

// 기존 회원·커뮤니티 예외 처리 범위를 변경하지 않는다.
@RestControllerAdvice(basePackageClasses = InstitutionController.class)
public class InstitutionExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(InstitutionExceptionHandler.class);

    // 조회 실패도 기존 공통 응답 형식을 사용한다.
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> api(ApiException error) {
        return ResponseEntity
                .status(error.getErrorCode().getStatus())
                .body(ApiResponse.fail(
                        error.getCode(),
                        error.getMessage()
                ));
    }

    // 숫자가 아닌 기관 ID는 서버 오류가 아닌 입력 오류다.
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> invalidId() {
        return ResponseEntity.badRequest()
                .body(ApiResponse.fail(
                        "INVALID_INPUT",
                        "기관 번호를 확인해주세요."
                ));
    }

    // SQL·접속 상세는 응답에 노출하지 않고 서버 로그에 남긴다.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> unexpected(Exception error) {
        log.error("기관 조회 처리 실패", error);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail(
                        "INTERNAL_ERROR",
                        "기관 정보를 불러오지 못했습니다."
                ));
    }
}