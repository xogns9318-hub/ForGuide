package com.example.forguide.member.controller;

import static com.example.forguide.member.controller.EmailVerificationSteps.verifiedToken;
import static com.example.forguide.member.controller.EmailVerificationSteps.withToken;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.forguide.member.service.VerificationMailSender;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * 회원가입·로그인·재발급·로그아웃 전체 흐름 (테스트 DB: H2, 스키마: test/resources/member/schema.sql)
 */
@SpringBootTest
// 스키마에 한글 선택지가 있어 UTF-8로 읽는다 (Windows 기본 인코딩으로 읽으면 깨진다)
@Sql(scripts = "/member/schema.sql", config = @SqlConfig(encoding = "UTF-8"))
class AuthControllerTest {

    private static final String SIGNUP_JSON =
            "{\"loginId\":\"newuser1\",\"password\":\"Abcdef1!\",\"givenName\":\" Van A \",\"familyName\":\" Nguyen \",\"nickname\":\" 데모 \",\"email\":\"New@Example.com\"}";
    private static final String LOGIN_JSON = "{\"loginId\":\"newuser1\",\"password\":\"Abcdef1!\"}";

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

    private MockHttpServletResponse signup() throws Exception {
        return mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content(verified(SIGNUP_JSON, "New@Example.com")))
                .andReturn().getResponse();
    }

    // 이메일 인증을 마친 가입 JSON
    private String verified(String signupJson, String email) throws Exception {
        return withToken(signupJson, verifiedToken(mockMvc, mail, email));
    }

    private MockHttpServletResponse login() throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(LOGIN_JSON))
                .andReturn().getResponse();
    }

    @Test
    void 회원가입_성공_비밀번호는_BCrypt로_저장되고_응답에_없다() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content(verified(SIGNUP_JSON, "New@Example.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.loginId").value("newuser1"))
                .andExpect(jsonPath("$.data.name").value("Van A Nguyen"))
                .andExpect(jsonPath("$.data.givenName").value("Van A"))
                .andExpect(jsonPath("$.data.familyName").value("Nguyen"))
                .andExpect(jsonPath("$.data.nickname").value("데모"))
                .andExpect(jsonPath("$.data.email").value("new@example.com"))
                .andExpect(jsonPath("$.data.password").doesNotExist());

        String saved = jdbcTemplate.queryForObject("SELECT password FROM members WHERE login_id = 'newuser1'", String.class);
        assertThat(saved).startsWith("$2a$").isNotEqualTo("Abcdef1!");
    }

    @Test
    void 성은_비워도_가입되고_표시_이름은_이름만() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content(verified("{\"loginId\":\"mono1\",\"password\":\"Abcdef1!\",\"givenName\":\"Sukarno\","
                                + "\"nickname\":\"수카르노\",\"email\":\"mono@example.com\"}", "mono@example.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Sukarno"))
                .andExpect(jsonPath("$.data.familyName").doesNotExist());

        String family = jdbcTemplate.queryForObject("SELECT family_name FROM members WHERE login_id = 'mono1'", String.class);
        assertThat(family).isNull();
    }

    @Test
    void 닉네임_규칙_위반은_400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"nick1\",\"password\":\"Abcdef1!\",\"givenName\":\"A\","
                                + "\"nickname\":\"ab\u200Bcd\",\"email\":\"nick@example.com\",\"emailVerificationToken\":\"any\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fieldErrors.nickname").value("닉네임에 쓸 수 없는 문자가 있습니다."));

        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM members WHERE login_id = 'nick1'", Integer.class);
        assertThat(count).isZero();
    }

    @Test
    void 아이디_중복_확인() throws Exception {
        mockMvc.perform(get("/api/v1/auth/check-login-id").param("loginId", "newuser1"))
                .andExpect(jsonPath("$.data.available").value(true));
        signup();
        mockMvc.perform(get("/api/v1/auth/check-login-id").param("loginId", "newuser1"))
                .andExpect(jsonPath("$.data.available").value(false));
        mockMvc.perform(get("/api/v1/auth/check-login-id").param("loginId", "AB"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fieldErrors.loginId").exists());
    }

    @Test
    void 아이디_이메일_중복_가입은_409() throws Exception {
        signup();
        // 중복 확인은 인증 토큰 확인보다 먼저 한다 (이미 가입된 이메일은 인증 코드도 받을 수 없으므로)
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content(withToken(SIGNUP_JSON, "any")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("LOGIN_ID_DUPLICATED"));

        // 대소문자만 다른 이메일도 중복
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"other22\",\"password\":\"Abcdef1!\",\"givenName\":\"A\",\"nickname\":\"닉네임\",\"email\":\"NEW@example.COM\",\"emailVerificationToken\":\"any\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("EMAIL_DUPLICATED"))
                .andExpect(jsonPath("$.error.fieldErrors.email").exists());
    }

    @Test
    void 가입_입력_규칙_위반은_항목별_400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"AB\",\"password\":\"abcdefgh\",\"givenName\":\"\",\"familyName\":\"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\",\"email\":\"bad\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"))
                .andExpect(jsonPath("$.error.fieldErrors.loginId").exists())
                .andExpect(jsonPath("$.error.fieldErrors.password").exists())
                .andExpect(jsonPath("$.error.fieldErrors.givenName").exists())
                .andExpect(jsonPath("$.error.fieldErrors.familyName").exists())
                .andExpect(jsonPath("$.error.fieldErrors.nickname").exists())
                .andExpect(jsonPath("$.error.fieldErrors.email").exists())
                .andExpect(jsonPath("$.error.fieldErrors.emailVerificationToken").exists());
    }

    @Test
    void 로그인_성공_access_token은_본문_refresh_token은_HttpOnly_쿠키() throws Exception {
        signup();
        MockHttpServletResponse response = login();

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getContentAsString()).contains("\"accessToken\"").doesNotContain("refreshToken");

        String setCookie = response.getHeader(HttpHeaders.SET_COOKIE);
        assertThat(setCookie).contains("refreshToken=").contains("HttpOnly").contains("SameSite=Strict")
                .contains("Path=/api/v1/auth").contains("Max-Age=1209600");

        // DB에는 원문이 아니라 해시가 저장된다
        String raw = response.getCookie("refreshToken").getValue();
        String stored = jdbcTemplate.queryForObject("SELECT token FROM refresh_tokens", String.class);
        assertThat(stored).isNotEqualTo(raw).hasSize(64);
    }

    @Test
    void 로그인_실패는_아이디_비밀번호_구분_없이_같은_응답() throws Exception {
        signup();
        String wrongPassword = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"newuser1\",\"password\":\"Wrong123!\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String noUser = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"nobody99\",\"password\":\"Abcdef1!\"}"))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        assertThat(wrongPassword).isEqualTo(noUser).contains("LOGIN_FAILED");
    }

    private ResultActions loginWith(String loginId, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"loginId\":\"" + loginId + "\",\"password\":\"" + password + "\"}"));
    }

    @Test
    void 다섯_번_틀리면_잠기고_맞는_비밀번호도_거부된다() throws Exception {
        signup();
        for (int i = 0; i < 4; i++) {
            loginWith("newuser1", "Wrong123!").andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"));
        }
        // 5번째 실패에서 바로 잠김 안내
        loginWith("newuser1", "Wrong123!")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("LOGIN_LOCKED"));

        loginWith("newuser1", "Abcdef1!")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("LOGIN_LOCKED"));
    }

    @Test
    void 잠금_시간이_지나면_다시_로그인할_수_있다() throws Exception {
        signup();
        for (int i = 0; i < 5; i++) {
            loginWith("newuser1", "Wrong123!");
        }
        jdbcTemplate.update("UPDATE login_attempts SET locked_until = DATEADD('MINUTE', -1, CURRENT_TIMESTAMP)");

        loginWith("newuser1", "Abcdef1!").andExpect(status().isOk());
    }

    @Test
    void 로그인에_성공하면_실패_횟수가_초기화된다() throws Exception {
        signup();
        for (int i = 0; i < 4; i++) {
            loginWith("newuser1", "Wrong123!");
        }
        loginWith("newuser1", "Abcdef1!").andExpect(status().isOk());

        // 다시 4번 틀려도 잠기지 않는다 (앞의 4번은 지워졌다)
        for (int i = 0; i < 4; i++) {
            loginWith("newuser1", "Wrong123!").andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"));
        }
        loginWith("newuser1", "Abcdef1!").andExpect(status().isOk());
    }

    @Test
    void 오래된_실패는_다시_센다() throws Exception {
        signup();
        for (int i = 0; i < 4; i++) {
            loginWith("newuser1", "Wrong123!");
        }
        jdbcTemplate.update("UPDATE login_attempts SET last_failed_at = DATEADD('MINUTE', -16, CURRENT_TIMESTAMP)");

        // 15분이 지난 실패 기록은 지우고 1번째 실패부터 다시 센다
        loginWith("newuser1", "Wrong123!").andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"));
        Integer count = jdbcTemplate.queryForObject("SELECT failed_count FROM login_attempts", Integer.class);
        assertThat(count).isEqualTo(1);
    }

    @Test
    void 없는_아이디도_똑같이_잠긴다() throws Exception {
        // 잠김 응답으로 가입 여부가 드러나지 않게 한다
        for (int i = 0; i < 4; i++) {
            loginWith("nobody99", "Wrong123!").andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"));
        }
        loginWith("nobody99", "Wrong123!").andExpect(jsonPath("$.error.code").value("LOGIN_LOCKED"));
    }

    @Test
    void 한_아이디가_잠겨도_다른_아이디는_로그인된다() throws Exception {
        signup();
        for (int i = 0; i < 5; i++) {
            loginWith("other123", "Wrong123!");
        }
        loginWith("newuser1", "Abcdef1!").andExpect(status().isOk());
    }

    @Test
    void 재발급하면_토큰이_바뀌고_쓴_토큰은_다시_못_쓴다() throws Exception {
        signup();
        Cookie first = login().getCookie("refreshToken");

        MockHttpServletResponse refreshed = mockMvc.perform(post("/api/v1/auth/refresh").cookie(first))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.member.loginId").value("newuser1"))
                .andReturn().getResponse();
        Cookie second = refreshed.getCookie("refreshToken");
        assertThat(second.getValue()).isNotEqualTo(first.getValue());

        // 이미 쓴 첫 번째 토큰은 거부
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(first))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_INVALID"));

        // 새 토큰은 사용 가능
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(second)).andExpect(status().isOk());
    }

    @Test
    void 쿠키_없이_재발급은_200이고_data가_없다() throws Exception {
        // 처음 접속한 비로그인 사용자: 오류가 아니라 "로그인 정보 없음"으로 응답한다 (쿠키도 새로 만들지 않는다)
        mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    @Test
    void 잘못된_refresh_token은_401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(new Cookie("refreshToken", "forged-token")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_INVALID"));
    }

    @Test
    void 만료된_refresh_token은_401() throws Exception {
        signup();
        Cookie cookie = login().getCookie("refreshToken");
        jdbcTemplate.update("UPDATE refresh_tokens SET expires_at = DATEADD('MINUTE', -1, CURRENT_TIMESTAMP)");

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_INVALID"));
    }

    @Test
    void 로그아웃하면_재발급이_불가능하고_쿠키도_지운다() throws Exception {
        signup();
        Cookie cookie = login().getCookie("refreshToken");

        MockHttpServletResponse loggedOut = mockMvc.perform(post("/api/v1/auth/logout").cookie(cookie))
                .andExpect(status().isOk())
                .andReturn().getResponse();
        assertThat(loggedOut.getHeader(HttpHeaders.SET_COOKIE)).contains("Max-Age=0");

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(cookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("REFRESH_INVALID"));
    }

    // ── 비밀번호 찾기(재설정) ──

    private ResultActions resetPassword(String email, String token, String newPassword) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/password/reset").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"verificationToken\":\"" + token
                        + "\",\"newPassword\":\"" + newPassword + "\"}"));
    }

    @Test
    void 비밀번호를_재설정하면_새_비밀번호로만_로그인되고_모든_기기가_로그아웃된다() throws Exception {
        signup();
        Cookie device = login().getCookie("refreshToken");
        String token = verifiedToken(mockMvc, mail, "new@example.com", "PASSWORD_RESET");

        // 로그인 화면에 미리 채울 아이디를 돌려준다
        resetPassword("NEW@example.com", token, "Newpass2@")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loginId").value("newuser1"));

        loginWith("newuser1", "Abcdef1!").andExpect(status().isUnauthorized());
        loginWith("newuser1", "Newpass2@").andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(device)).andExpect(status().isUnauthorized());
    }

    @Test
    void 재설정하면_로그인_잠금도_풀린다() throws Exception {
        signup();
        for (int i = 0; i < 5; i++) {
            loginWith("newuser1", "Wrong123!");
        }
        loginWith("newuser1", "Abcdef1!").andExpect(jsonPath("$.error.code").value("LOGIN_LOCKED"));

        String token = verifiedToken(mockMvc, mail, "new@example.com", "PASSWORD_RESET");
        resetPassword("new@example.com", token, "Newpass2@").andExpect(status().isOk());

        loginWith("newuser1", "Newpass2@").andExpect(status().isOk());
    }

    @Test
    void 가입되지_않은_이메일도_같은_응답이고_메일은_보내지_않는다() throws Exception {
        signup();
        String registered = mockMvc.perform(post("/api/v1/auth/email/send-code").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"new@example.com\",\"purpose\":\"PASSWORD_RESET\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String unknown = mockMvc.perform(post("/api/v1/auth/email/send-code").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ghost@example.com\",\"purpose\":\"PASSWORD_RESET\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(unknown).isEqualTo(registered);
        verify(mail, never()).send(eq("ghost@example.com"), anyString(), any(), anyLong());

        // 재발송 간격도 똑같이 적용된다
        mockMvc.perform(post("/api/v1/auth/email/send-code").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ghost@example.com\",\"purpose\":\"PASSWORD_RESET\"}"))
                .andExpect(jsonPath("$.error.code").value("VERIFICATION_RESEND_TOO_SOON"));
    }

    @Test
    void 가입용_토큰이나_쓴_토큰으로는_재설정할_수_없다() throws Exception {
        // 가입용(SIGNUP) 토큰은 용도가 달라 거부
        String signupToken = verifiedToken(mockMvc, mail, "new@example.com");
        resetPassword("new@example.com", signupToken, "Newpass2@")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("EMAIL_NOT_VERIFIED"));

        // 한 번 쓴 재설정 토큰은 다시 쓸 수 없다
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                .content(withToken(SIGNUP_JSON, signupToken)));
        String token = verifiedToken(mockMvc, mail, "new@example.com", "PASSWORD_RESET");
        resetPassword("new@example.com", token, "Newpass2@").andExpect(status().isOk());
        resetPassword("new@example.com", token, "Newpass3#")
                .andExpect(jsonPath("$.error.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    void 새_비밀번호가_규칙에_맞지_않으면_400() throws Exception {
        resetPassword("new@example.com", "any", "short")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fieldErrors.newPassword").exists());
    }
}
