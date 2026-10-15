package com.example.forguide.member.security;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.forguide.member.common.ApiResponse;
import com.example.forguide.member.jwt.JwtProvider;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;

/**
 * Security·JWT 동작 확인. 앱 전체를 띄우고(테스트 DB: H2) 잠근 주소(/api/v1/members/me/**)와 열린 주소를 호출한다.
 */
@SpringBootTest
@Import(SecurityConfigTest.TestController.class)
class SecurityConfigTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtProvider jwtProvider;

    @Value("${jwt.secret}")
    private String secret;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void 토큰_없이_보호_주소는_401_AUTH_REQUIRED() throws Exception {
        mockMvc.perform(get("/api/v1/members/me/test-protected"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("AUTH_REQUIRED"));
    }

    @Test
    void 올바른_토큰이면_컨트롤러에서_회원_번호를_받는다() throws Exception {
        String token = jwtProvider.createAccessToken(7L);

        mockMvc.perform(get("/api/v1/members/me/test-protected").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.memberId").value(7));
    }

    @Test
    void 만료된_토큰은_401_TOKEN_EXPIRED() throws Exception {
        String expired = Jwts.builder()
                .subject("7")
                .issuedAt(Date.from(Instant.now().minusSeconds(3600)))
                .expiration(Date.from(Instant.now().minusSeconds(60)))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret)))
                .compact();

        mockMvc.perform(get("/api/v1/members/me/test-protected").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("TOKEN_EXPIRED"));
    }

    @Test
    void 내용을_바꾼_토큰은_401_TOKEN_INVALID() throws Exception {
        String token = jwtProvider.createAccessToken(7L);
        // 서명은 그대로 두고 내용(가운데 부분)만 다른 회원 번호로 바꾼 위조 토큰
        String[] parts = token.split("\\.");
        String forgedPayload = java.util.Base64.getUrlEncoder().withoutPadding()
                .encodeToString("{\"sub\":\"1\",\"exp\":9999999999}".getBytes());
        String forged = parts[0] + "." + forgedPayload + "." + parts[2];

        mockMvc.perform(get("/api/v1/members/me/test-protected").header("Authorization", "Bearer " + forged))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("TOKEN_INVALID"));
    }

    @Test
    void 다른_키로_서명한_토큰은_401_TOKEN_INVALID() throws Exception {
        String otherKeyToken = Jwts.builder()
                .subject("7")
                .expiration(Date.from(Instant.now().plusSeconds(600)))
                .signWith(Keys.hmacShaKeyFor("another-secret-key-that-is-32-bytes!!".getBytes()))
                .compact();

        mockMvc.perform(get("/api/v1/members/me/test-protected").header("Authorization", "Bearer " + otherKeyToken))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("TOKEN_INVALID"));
    }

    @Test
    void 잠그지_않은_주소는_토큰_없이_열리고_회원_번호는_없다() throws Exception {
        mockMvc.perform(get("/api/v1/test-open/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loggedIn").value(false));
    }

    @Test
    void 잠그지_않은_주소도_토큰이_있으면_회원_번호를_받는다() throws Exception {
        String token = jwtProvider.createAccessToken(9L);
        mockMvc.perform(get("/api/v1/test-open/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.memberId").value(9));
    }

    @Test
    void 인증_주소는_토큰_없이도_열린다() throws Exception {
        mockMvc.perform(get("/api/v1/auth/test-public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void 인증_주소는_만료된_토큰이_실려와도_막지_않는다() throws Exception {
        mockMvc.perform(get("/api/v1/auth/test-public").header("Authorization", "Bearer broken.token.value"))
                .andExpect(status().isOk());
    }

    @Test
    void 세션_쿠키를_만들지_않는다() throws Exception {
        String token = jwtProvider.createAccessToken(7L);
        mockMvc.perform(get("/api/v1/members/me/test-protected").header("Authorization", "Bearer " + token))
                .andExpect(result -> {
                    if (result.getResponse().getHeader("Set-Cookie") != null
                            && result.getResponse().getHeader("Set-Cookie").contains("JSESSIONID")) {
                        throw new AssertionError("세션 쿠키가 만들어졌습니다.");
                    }
                });
    }

    @RestController
    static class TestController {

        @GetMapping("/api/v1/members/me/test-protected")
        ApiResponse<Map<String, Long>> me(@AuthenticationPrincipal Long memberId) {
            return ApiResponse.ok(Map.of("memberId", memberId));
        }

        @GetMapping("/api/v1/test-open/me")
        ApiResponse<Map<String, Object>> open(@AuthenticationPrincipal Long memberId) {
            return memberId == null
                    ? ApiResponse.ok(Map.of("loggedIn", false))
                    : ApiResponse.ok(Map.of("loggedIn", true, "memberId", memberId));
        }

        @GetMapping("/api/v1/auth/test-public")
        ApiResponse<Void> publicEndpoint() {
            return ApiResponse.ok();
        }
    }
}
