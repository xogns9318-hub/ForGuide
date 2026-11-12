package com.example.forguide.member.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * 인증 메일 하루 전체 상한 (모든 주소 합계). 테스트에서는 상한을 2통으로 둔다.
 * 오늘 보낸 수는 서버 메모리에 있으므로 테스트마다 새 서버(컨텍스트)로 시작한다.
 */
@SpringBootTest(properties = "forguide.mail.daily-total-limit=2")
@Sql(scripts = "/member/schema.sql", config = @SqlConfig(encoding = "UTF-8"))
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class EmailVerificationDailyTotalLimitTest {

    @Autowired
    private WebApplicationContext context;

    // 메일은 실제로 보내지 않는다
    @MockitoBean
    private VerificationMailSender mail;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    private ResultActions sendCode(String email, String purpose) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/email/send-code").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"purpose\":\"" + purpose + "\"}"));
    }

    @Test
    void 상한에_닿으면_다른_주소도_막힌다() throws Exception {
        sendCode("a1@example.com", "SIGNUP").andExpect(status().isOk());
        sendCode("a2@example.com", "SIGNUP").andExpect(status().isOk());

        sendCode("a3@example.com", "SIGNUP")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("VERIFICATION_DAILY_LIMIT"));

        // 계정 찾기도 같은 안내로 막는다 (가입되지 않은 주소라도 응답이 같아야 가입 여부를 알 수 없다)
        sendCode("nobody@example.com", "PASSWORD_RESET")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("VERIFICATION_DAILY_LIMIT"));
    }

    @Test
    void 보내지_못한_메일은_세지_않는다() throws Exception {
        doThrow(new IllegalStateException("메일 서버 오류"))
                .when(mail).send(anyString(), anyString(), any(), anyLong());
        sendCode("fail@example.com", "SIGNUP")
                .andExpect(jsonPath("$.error.code").value("MAIL_SEND_FAILED"));

        doNothing().when(mail).send(anyString(), anyString(), any(), anyLong());
        sendCode("b1@example.com", "SIGNUP").andExpect(status().isOk());
        sendCode("b2@example.com", "SIGNUP").andExpect(status().isOk());
        sendCode("b3@example.com", "SIGNUP").andExpect(status().isTooManyRequests());
    }

    @Test
    void 가입되지_않은_주소의_계정_찾기는_메일을_보내지_않으므로_세지_않는다() throws Exception {
        sendCode("ghost1@example.com", "PASSWORD_RESET").andExpect(status().isOk());
        sendCode("ghost2@example.com", "FIND_ID").andExpect(status().isOk());
        sendCode("ghost3@example.com", "PASSWORD_RESET").andExpect(status().isOk());

        // 실제 발송은 아직 0통이므로 가입용 2통은 보낼 수 있다
        sendCode("c1@example.com", "SIGNUP").andExpect(status().isOk());
        sendCode("c2@example.com", "SIGNUP").andExpect(status().isOk());
        sendCode("c3@example.com", "SIGNUP").andExpect(status().isTooManyRequests());
    }
}
