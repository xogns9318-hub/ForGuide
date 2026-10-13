package com.example.forguide.member.security;

import com.example.forguide.member.common.ApiException;
import com.example.forguide.member.common.ApiResponse;
import com.example.forguide.member.common.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

/**
 * 로그인이 필요한 주소에 인증 없이 들어왔을 때 401 응답을 직접 만든다.
 * 필터 단계라 컨트롤러 예외 처리기를 거치지 않으므로, 같은 ApiResponse 모양으로 여기서 작성한다.
 */
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public JwtAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        // JwtAuthenticationFilter가 남긴 실패 이유. 없으면 토큰 자체를 안 보낸 것
        Object error = request.getAttribute(JwtAuthenticationFilter.AUTH_ERROR);
        ErrorCode code = (error instanceof ApiException apiException)
                ? apiException.getErrorCode()   // TOKEN_EXPIRED · TOKEN_INVALID
                : ErrorCode.AUTH_REQUIRED;

        response.setStatus(code.getStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), ApiResponse.fail(code.name(), code.getDefaultMessage()));
    }
}
