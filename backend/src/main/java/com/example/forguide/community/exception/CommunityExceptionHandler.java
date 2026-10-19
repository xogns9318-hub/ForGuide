
package com.example.forguide.community.exception;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.common.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;


/**
 * 커뮤니티 API에서 발생하는 예외를 처리하는 클래스
 * 회원 기능에서 사용하는 ApiResponse, ErrorCode를 재사용하여
 * 커뮤니티 API도 동일한 오류 응답 형식으로 반환
 */
@RestControllerAdvice(basePackages = "com.example.forguide.community")
public class CommunityExceptionHandler {

    /**
     * 서비스에서 직접 발생시킨 ApiException을 처리
     * ErrorCode에 정의된 HTTP 상태 코드와 오류 메시지를 반환
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException e) {
        return ResponseEntity.status(e.getErrorCode().getStatus())
                .body(ApiResponse.fail(
                        e.getCode(),
                        e.getMessage(),
                        e.getFieldErrors()
                ));
    }

    /**
     * @Valid를 통한 게시글 작성 요청 검증 실패를 처리
     * HTTP 400과 필드별 오류 메시지를 반환
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(
            MethodArgumentNotValidException e
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        // 검증에 실패한 필드 이름과 오류 메시지를 수집
        // 같은 필드에 오류가 여러 개 발생하면 첫 번째 메시지만 저장
        for (FieldError error : e.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(
                    error.getField(),
                    error.getDefaultMessage()
            );
        }

        return invalidInput(fieldErrors);
    }

    /**
     * 메서드 매개변수의 제약 조건 위반을 처리
     * 예: 게시글 조회 size가 1 미만이거나 50을 초과한 경우
     * ConstraintViolationException이 발생하면 HTTP 400을 반환
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            ConstraintViolationException e
    ) {
        return invalidInput(Map.of());
    }

    /**
     * Spring MVC의 메서드 매개변수 검증 실패를 처리
     * 예: /posts/scroll?size=100 요청 시
     * size의 허용 범위(1~50)를 벗어나면 HTTP 400으로 반환
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodValidation(
            HandlerMethodValidationException e
    ) {
        return invalidInput(Map.of());
    }

    /**
     * 요청 본문의 JSON 형식이 잘못되었거나
     * 전달된 값의 자료형이 맞지 않는 경우 처리
     * 잘못된 요청이므로 HTTP 400을 반환
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadable(
            HttpMessageNotReadableException e
    ) {
        return invalidInput(Map.of());
    }

    /**
     * 필수 요청 파라미터가 누락된 경우 처리
     * 예: /posts/scroll 요청에서 필수 size를 전달하지 않은 경우
     * HTTP 400을 반환
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingParameter(
            MissingServletRequestParameterException e
    ) {
        return invalidInput(Map.of());
    }

    /**
     * 입력값 오류 응답을 생성하는 공통 메서드
     * 여러 검증 메서드에서 동일한 HTTP 400 응답 형식을 사용
     */
    private ResponseEntity<ApiResponse<Void>> invalidInput(
            Map<String, String> fieldErrors
    ) {
        return ResponseEntity.status(ErrorCode.INVALID_INPUT.getStatus())
                .body(ApiResponse.fail(
                        ErrorCode.INVALID_INPUT.name(),
                        ErrorCode.INVALID_INPUT.getDefaultMessage(),
                        fieldErrors
                ));
    }
}
