package com.example.forguide.member.controller;

import static com.example.forguide.member.controller.EmailVerificationSteps.lastCode;
import static com.example.forguide.member.controller.EmailVerificationSteps.verifiedToken;
import static com.example.forguide.member.controller.EmailVerificationSteps.withToken;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.forguide.member.service.VerificationMailSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * 이메일 인증: 코드 보내기 → 확인 → 가입에서 토큰 사용 (테스트 DB: H2, 메일 발송은 가짜 객체로 대신함)
 */
@SpringBootTest
// 스키마에 한글 선택지가 있어 UTF-8로 읽는다 (Windows 기본 인코딩으로 읽으면 깨진다)
@Sql(scripts = "/member/schema.sql", config = @SqlConfig(encoding = "UTF-8"))
class EmailVerificationControllerTest {

    private static final String EMAIL = "verify@example.com";
    private static final String SIGNUP_JSON =
            "{\"loginId\":\"verify1\",\"password\":\"Abcdef1!\",\"givenName\":\"A\",\"nickname\":\"인증\",\"email\":\"" + EMAIL + "\"}";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // 메일은 실제로 보내지 않고, 보낸 코드를 테스트에서 꺼내 쓴다
    @MockitoBean
    private VerificationMailSender mail;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private ResultActions sendCode(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/email/send-code").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"purpose\":\"SIGNUP\"}"));
    }

    private ResultActions verify(String email, String code) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/email/verify").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"purpose\":\"SIGNUP\",\"code\":\"" + code + "\"}"));
    }

    private ResultActions signup(String json) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    // 받은 코드와 다른 6자리 코드
    private String wrongCode() {
        return lastCode(mail, EMAIL).equals("000000") ? "111111" : "000000";
    }

    @Test
    void 코드를_보내면_6자리_코드가_가고_DB에는_해시만_저장된다() throws Exception {
        sendCode(EMAIL)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.expiresInSeconds").value(600))
                .andExpect(jsonPath("$.data.resendAfterSeconds").value(60));

        String code = lastCode(mail, EMAIL);
        assertThat(code).matches("[0-9]{6}");
        String stored = jdbcTemplate.queryForObject("SELECT code_hash FROM email_verifications", String.class);
        assertThat(stored).hasSize(64).doesNotContain(code);
    }

    @Test
    void 맞는_코드로_확인하면_토큰을_받고_그_토큰으로_가입된다() throws Exception {
        String token = verifiedToken(mockMvc, mail, EMAIL);
        assertThat(token).isNotBlank();

        signup(withToken(SIGNUP_JSON, token)).andExpect(status().isCreated());
    }

    @Test
    void 인증_없이_가입하면_400() throws Exception {
        signup(SIGNUP_JSON)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fieldErrors.emailVerificationToken").exists());
        signup(withToken(SIGNUP_JSON, "forged-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    void 다른_이메일로_받은_토큰으로는_가입할_수_없다() throws Exception {
        String token = verifiedToken(mockMvc, mail, "other@example.com");

        signup(withToken(SIGNUP_JSON, token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    void 토큰은_한_번만_쓸_수_있다() throws Exception {
        String token = verifiedToken(mockMvc, mail, EMAIL);
        signup(withToken(SIGNUP_JSON, token)).andExpect(status().isCreated());

        // 가입한 회원을 지우고 같은 토큰으로 다시 가입 시도 → 이미 쓴 토큰이라 거부
        jdbcTemplate.update("DELETE FROM members");
        signup(withToken(SIGNUP_JSON, token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    void 틀린_코드는_400이고_5번_틀리면_코드가_무효가_된다() throws Exception {
        sendCode(EMAIL);
        String wrong = wrongCode();

        for (int i = 0; i < 4; i++) {
            verify(EMAIL, wrong)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error.code").value("VERIFICATION_CODE_INVALID"));
        }
        verify(EMAIL, wrong).andExpect(jsonPath("$.error.code").value("VERIFICATION_ATTEMPTS_EXCEEDED"));

        // 이제는 맞는 코드도 받지 않는다
        verify(EMAIL, lastCode(mail, EMAIL)).andExpect(jsonPath("$.error.code").value("VERIFICATION_ATTEMPTS_EXCEEDED"));
    }

    @Test
    void 만료된_코드는_거부() throws Exception {
        sendCode(EMAIL);
        jdbcTemplate.update("UPDATE email_verifications SET expires_at = DATEADD('MINUTE', -1, CURRENT_TIMESTAMP)");

        verify(EMAIL, lastCode(mail, EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VERIFICATION_EXPIRED"));
    }

    @Test
    void 확인을_마친_코드는_다시_쓸_수_없다() throws Exception {
        sendCode(EMAIL);
        String code = lastCode(mail, EMAIL);
        verify(EMAIL, code).andExpect(status().isOk());

        verify(EMAIL, code).andExpect(jsonPath("$.error.code").value("VERIFICATION_EXPIRED"));
    }

    @Test
    void 일분_안에_다시_보내면_429() throws Exception {
        sendCode(EMAIL).andExpect(status().isOk());
        sendCode(EMAIL)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("VERIFICATION_RESEND_TOO_SOON"));
    }

    @Test
    void 하루_10번을_넘기면_429() throws Exception {
        // 지난 기록 10건을 1분 이상 전으로 만들어 재발송 간격 제한은 피한다
        for (int i = 0; i < 10; i++) {
            jdbcTemplate.update("INSERT INTO email_verifications (email, purpose, code_hash, expires_at, created_at) "
                            + "VALUES (?, 'SIGNUP', ?, CURRENT_TIMESTAMP, DATEADD('MINUTE', ?, CURRENT_TIMESTAMP))",
                    EMAIL, "x".repeat(64), -(i + 2));
        }
        sendCode(EMAIL)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("VERIFICATION_DAILY_LIMIT"));
    }

    @Test
    void 이미_가입된_이메일은_코드를_보내지_않는다() throws Exception {
        String token = verifiedToken(mockMvc, mail, EMAIL);
        signup(withToken(SIGNUP_JSON, token)).andExpect(status().isCreated());

        sendCode("Verify@Example.com")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_DUPLICATED"));
    }

    @Test
    void 메일_발송이_실패하면_503이고_재발송을_막지_않는다() throws Exception {
        doThrow(new IllegalStateException("메일 서버 연결 실패(테스트)"))
                .when(mail).send(anyString(), anyString(), any(), anyLong());
        sendCode(EMAIL)
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error.code").value("MAIL_SEND_FAILED"));

        reset(mail);
        sendCode(EMAIL).andExpect(status().isOk());
    }

    @Test
    void 코드_형식이_틀리면_400() throws Exception {
        verify(EMAIL, "12ab")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fieldErrors.code").exists());
    }
}
