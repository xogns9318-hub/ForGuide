package com.example.forguide.member.controller;

import static com.example.forguide.member.controller.EmailVerificationSteps.verifiedToken;
import static com.example.forguide.member.controller.EmailVerificationSteps.withToken;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.forguide.member.service.VerificationMailSender;
import com.jayway.jsonpath.JsonPath;
import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.apache.ibatis.annotations.Mapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.AnnotatedBeanDefinition;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.type.filter.AnnotationTypeFilter;
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
 * SQL 인젝션 방지 (회원 기능 범위)
 *
 * 1) 막는 장치: 회원 매퍼 SQL은 값을 항상 #{}(PreparedStatement 자리표시자)로 넘긴다.
 *    ${}는 값을 SQL 문장에 그대로 이어 붙여 인젝션이 되므로, 매퍼 XML에 들어오면 이 테스트가 실패한다.
 *    매퍼 인터페이스의 어노테이션 SQL(@Select 등)도 XML 밖이라 검사가 빠지므로 쓰지 않는다.
 * 2) 공격 시도: 공격 문자열을 넣어도 SQL로 실행되지 않고 일반 값으로만 다뤄지는지 확인한다.
 */
@SpringBootTest
// 스키마에 한글 선택지가 있어 UTF-8로 읽는다 (Windows 기본 인코딩으로 읽으면 깨진다)
@Sql(scripts = "/member/schema.sql", config = @SqlConfig(encoding = "UTF-8"))
class SqlInjectionTest {

    // 로그인 우회를 노리는 대표적인 공격 문자열
    private static final String BYPASS = "' OR '1'='1' --";
    private static final String DROP = "'; DROP TABLE members; --";

    // 매퍼 인터페이스에 쓰면 안 되는 어노테이션 SQL
    private static final Set<String> ANNOTATION_SQL = Set.of(
            "Select", "Insert", "Update", "Delete",
            "SelectProvider", "InsertProvider", "UpdateProvider", "DeleteProvider");

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

    // ── 1) 막는 장치 ──

    @Test
    void 회원_매퍼_XML에는_달러_중괄호_치환이_없다() throws Exception {
        Resource[] xmls = new PathMatchingResourcePatternResolver().getResources("classpath*:mapper/member/*.xml");
        assertThat(xmls).isNotEmpty();

        List<String> found = new ArrayList<>();
        for (Resource xml : xmls) {
            String[] lines = xml.getContentAsString(StandardCharsets.UTF_8).split("\\R");
            for (int i = 0; i < lines.length; i++) {
                if (lines[i].contains("${")) {
                    found.add(xml.getFilename() + ":" + (i + 1) + "  " + lines[i].trim());
                }
            }
        }
        assertThat(found).as("${}는 값을 SQL에 그대로 이어 붙입니다. #{}로 바꾸세요").isEmpty();
    }

    @Test
    void 회원_매퍼_인터페이스에는_어노테이션_SQL이_없다() throws Exception {
        // @Mapper가 붙은 회원 매퍼 인터페이스를 모두 찾는다 (기본 스캐너는 인터페이스를 빼므로 허용한다)
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false) {
            @Override
            protected boolean isCandidateComponent(AnnotatedBeanDefinition definition) {
                return definition.getMetadata().isInterface();
            }
        };
        scanner.addIncludeFilter(new AnnotationTypeFilter(Mapper.class));
        Set<BeanDefinition> mappers = scanner.findCandidateComponents("com.example.forguide.member");
        assertThat(mappers).isNotEmpty();

        List<String> found = new ArrayList<>();
        for (BeanDefinition mapper : mappers) {
            for (Method method : Class.forName(mapper.getBeanClassName()).getDeclaredMethods()) {
                for (Annotation annotation : method.getAnnotations()) {
                    if (ANNOTATION_SQL.contains(annotation.annotationType().getSimpleName())) {
                        found.add(mapper.getBeanClassName() + "." + method.getName());
                    }
                }
            }
        }
        assertThat(found).as("SQL은 매퍼 XML에 #{}로 씁니다").isEmpty();
    }

    // ── 2) 공격 시도 ──

    private String signupAndLogin() throws Exception {
        String token = verifiedToken(mockMvc, mail, "victim@example.com");
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                .content(withToken("{\"loginId\":\"victim01\",\"password\":\"Abcdef1!\",\"givenName\":\"V\","
                        + "\"nickname\":\"피해자\",\"email\":\"victim@example.com\"}", token)));
        String body = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"victim01\",\"password\":\"Abcdef1!\"}"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.accessToken");
    }

    private ResultActions login(String loginId, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"loginId\":\"" + loginId.replace("\"", "\\\"") + "\",\"password\":\""
                        + password.replace("\"", "\\\"") + "\"}"));
    }

    private Integer memberCount() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM members", Integer.class);
    }

    @Test
    void 공격_문자열로_로그인을_우회할_수_없다() throws Exception {
        signupAndLogin();

        // 아이디·비밀번호 어느 쪽에 넣어도 일반 로그인 실패와 같은 응답
        login(BYPASS, BYPASS).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"));
        login("victim01' --", "anything").andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"));
        login("victim01", BYPASS).andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"));

        // 표를 지우려는 문자열도 그냥 없는 아이디로 처리된다
        login(DROP, "x").andExpect(jsonPath("$.error.code").value("LOGIN_FAILED"));
        assertThat(memberCount()).isEqualTo(1);
    }

    @Test
    void 아이디_확인과_인증_코드_요청에서도_SQL로_실행되지_않는다() throws Exception {
        signupAndLogin();

        // 아이디 형식 검사에서 먼저 막힌다
        mockMvc.perform(get("/api/v1/auth/check-login-id").param("loginId", BYPASS))
                .andExpect(status().isBadRequest());

        // 이메일 형식에 맞는 따옴표(')도 값으로만 저장된다
        mockMvc.perform(post("/api/v1/auth/email/send-code").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"o'brien@example.com\",\"purpose\":\"SIGNUP\"}"))
                .andExpect(status().isOk());
        String saved = jdbcTemplate.queryForObject(
                "SELECT email FROM email_verifications WHERE email LIKE 'o%'", String.class);
        assertThat(saved).isEqualTo("o'brien@example.com");
        assertThat(memberCount()).isEqualTo(1);
    }

    @Test
    void 프로필과_닉네임에_넣은_공격_문자열은_글자_그대로_저장된다() throws Exception {
        String accessToken = signupAndLogin();

        mockMvc.perform(patch("/api/v1/members/me/profile").header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"language\":\"ko\",\"job\":\"" + DROP + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.job").value(DROP));

        mockMvc.perform(patch("/api/v1/members/me/nickname").header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"" + BYPASS + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value(BYPASS));

        // 표는 그대로 있고, 다른 회원의 값이 바뀌지도 않았다
        assertThat(memberCount()).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT job FROM member_profiles", String.class)).isEqualTo(DROP);
    }
}
