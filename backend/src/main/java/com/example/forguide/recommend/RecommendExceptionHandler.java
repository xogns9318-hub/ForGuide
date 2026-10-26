package com.example.forguide.recommend;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.response.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "com.example.forguide.recommend")
public class RecommendExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RecommendExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> api(ApiException error) {
        return ResponseEntity
                .status(error.getErrorCode().getStatus())
                .body(ApiResponse.fail(error.getCode(), error.getMessage(), error.getFieldErrors()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> unexpected(Exception error) {
        log.error("추천 조회 처리 실패", error);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("INTERNAL_ERROR", "추천 결과를 불러오지 못했습니다."));
    }
}
