package com.example.forguide.member.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static com.example.forguide.member.support.EmailVerificationSteps.verifiedToken;
import static com.example.forguide.member.support.EmailVerificationSteps.withToken;

import com.example.forguide.member.support.RecordingMailConfig;
import com.example.forguide.member.support.RecordingMailConfig.RecordingMailSender;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * 회원가입·로그인·재발급·로그아웃 전체 흐름 (테스트 DB: H2, 스키마: test/resources/member/schema.sql)
 */
@SpringBootTest
@Import(RecordingMailConfig.class)
@Sql(scripts = "/member/schema.sql")
class AuthControllerTest {

    private static final String SIGNUP_JSON =
            "{\"loginId\":\"newuser1\",\"password\":\"Abcdef1!\",\"givenName\":\" Van A \",\"familyName\":\" Nguyen \",\"nickname\":\" 데모 \",\"email\":\"New@Example.com\"}";
    private static final String LOGIN_JSON = "{\"loginId\":\"newuser1\",\"password\":\"Abcdef1!\"}";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private RecordingMailSender mail;

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
}
