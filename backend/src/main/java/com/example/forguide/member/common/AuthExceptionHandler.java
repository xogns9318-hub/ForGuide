package com.example.forguide.member.common;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.common.response.ApiResponse;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * member 패키지 컨트롤러에서 생긴 예외를 실패 응답(ApiResponse.fail)으로 바꾼다.
 * 범위를 member 패키지로 제한해 다른 기능(팀원 담당)의 응답에는 영향을 주지 않는다.
 * 주의: 필터(Security) 단계의 예외는 여기까지 오지 않는다 → JwtAuthenticationEntryPoint가 처리한다.
 */
@RestControllerAdvice(basePackages = "com.example.forguide.member")
public class AuthExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(AuthExceptionHandler.class);

    /** 서비스 코드가 의도적으로 던진 예외 */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(ApiException e) {
        return respond(e.getErrorCode(), e.getMessage(), e.getFieldErrors());
    }

    /** @Valid 요청 본문 검증 실패 → 항목별 오류를 모아 한 번에 돌려준다 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : e.getBindingResult().getFieldErrors()) {
            // 한 항목에 오류가 여러 개면 첫 번째만 보여 준다
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return respond(ErrorCode.INVALID_INPUT, ErrorCode.INVALID_INPUT.getDefaultMessage(), fieldErrors);
    }

    /** JSON 형식이 깨졌거나 값의 타입이 맞지 않음 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadable(HttpMessageNotReadableException e) {
        return respond(ErrorCode.INVALID_INPUT);
    }

    /** 필수 쿼리 값·업로드 파일 항목이 빠짐 */
    @ExceptionHandler({MissingServletRequestParameterException.class, MissingServletRequestPartException.class})
    public ResponseEntity<ApiResponse<Void>> handleMissing(Exception e) {
        return respond(ErrorCode.INVALID_INPUT);
    }

    /** 업로드 용량 초과 (spring.servlet.multipart 설정 기준) */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleUploadSize(MaxUploadSizeExceededException e) {
        return respond(ErrorCode.INVALID_IMAGE);
    }

    /** 없는 주소 */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NoResourceFoundException e) {
        return respond(ErrorCode.NOT_FOUND);
    }

    /** 주소는 있지만 요청 방식(GET/POST 등)이 다름 */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethod(HttpRequestMethodNotSupportedException e) {
        return respond(ErrorCode.METHOD_NOT_ALLOWED);
    }

    /**
     * 예상하지 못한 오류.
     * 보안: 원인(SQL 문장, 내부 경로 등)이 응답으로 새지 않게 일반 문구만 보내고, 자세한 내용은 서버 로그에만 남긴다.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception e) {
        log.error("처리하지 못한 예외", e);
        return respond(ErrorCode.INTERNAL_ERROR);
    }

    private ResponseEntity<ApiResponse<Void>> respond(ErrorCode code) {
        return respond(code, code.getDefaultMessage(), Map.of());
    }

    private ResponseEntity<ApiResponse<Void>> respond(ErrorCode code, String message, Map<String, String> fieldErrors) {
        return ResponseEntity.status(code.getStatus())
                .body(ApiResponse.fail(code.name(), message, fieldErrors));
    }
}
