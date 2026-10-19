package com.example.forguide.member.common;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.common.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * 공통 응답 형식 검증. Security 필터 없이 컨트롤러 + 예외 처리기만 띄운다.
 */
class AuthExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new AuthExceptionHandler())
                .build();
    }

    @Test
    void 성공_응답은_data만_있고_error는_없다() throws Exception {
        mockMvc.perform(get("/test/ok"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.value").value("hello"))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    void ApiException은_코드의_상태와_문구로_응답한다() throws Exception {
        mockMvc.perform(get("/test/login-failed"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"))
                .andExpect(jsonPath("$.error.message").value("아이디 또는 비밀번호가 올바르지 않습니다."))
                .andExpect(jsonPath("$.error.fieldErrors").doesNotExist());
    }

    @Test
    void ApiException의_항목별_오류를_함께_보낸다() throws Exception {
        mockMvc.perform(get("/test/email-duplicated"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_DUPLICATED"))
                .andExpect(jsonPath("$.error.fieldErrors.email").value("이미 가입된 이메일입니다."));
    }

    @Test
    void Valid_검증_실패는_항목별로_모아_400으로_응답한다() throws Exception {
        mockMvc.perform(post("/test/valid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"email\":\"bad\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"))
                .andExpect(jsonPath("$.error.fieldErrors.name").value("이름을 입력해주세요."))
                .andExpect(jsonPath("$.error.fieldErrors.email").value("올바른 이메일 형식으로 입력해주세요."));
    }

    @Test
    void 깨진_JSON은_400_INVALID_INPUT() throws Exception {
        mockMvc.perform(post("/test/valid")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void 예상하지_못한_오류는_내부_내용을_숨기고_500() throws Exception {
        mockMvc.perform(get("/test/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.error.message").value("요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."));
    }

    @RestController
    static class TestController {

        record ValueResponse(String value) {
        }

        record CreateRequest(
                @NotBlank(message = "이름을 입력해주세요.") String name,
                @Email(message = "올바른 이메일 형식으로 입력해주세요.") String email) {
        }

        @GetMapping("/test/ok")
        ApiResponse<ValueResponse> ok() {
            return ApiResponse.ok(new ValueResponse("hello"));
        }

        @GetMapping("/test/login-failed")
        ApiResponse<Void> loginFailed() {
            throw new ApiException(ErrorCode.LOGIN_FAILED);
        }

        @GetMapping("/test/email-duplicated")
        ApiResponse<Void> emailDuplicated() {
            throw new ApiException(ErrorCode.EMAIL_DUPLICATED, Map.of("email", "이미 가입된 이메일입니다."));
        }

        @PostMapping("/test/valid")
        ApiResponse<Void> valid(@Valid @RequestBody CreateRequest request) {
            return ApiResponse.ok();
        }

        @GetMapping("/test/boom")
        ApiResponse<Void> boom() {
            throw new IllegalStateException("SELECT * FROM members -- 내부 정보");
        }
    }
}
