package com.example.forguide.member.controller;

import static com.example.forguide.member.controller.EmailVerificationSteps.verifiedToken;
import static com.example.forguide.member.controller.EmailVerificationSteps.withToken;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.forguide.member.service.VerificationMailSender;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * 닉네임·프로필 이미지 저장과 이미지 주소 공개 (테스트 DB: H2, 이미지는 임시 폴더)
 */
@SpringBootTest
@Sql(scripts = "/member/schema.sql")
class MemberControllerTest {

    @TempDir
    static Path imageDir;

    @DynamicPropertySource
    static void imageDirProperty(DynamicPropertyRegistry registry) {
        registry.add("forguide.profile-image.dir", () -> imageDir.toString());
    }

    @Autowired
    private WebApplicationContext context;

    // 메일은 실제로 보내지 않고, 보낸 코드를 테스트에서 꺼내 쓴다
    @MockitoBean
    private VerificationMailSender mail;

    private MockMvc mockMvc;
    private String accessToken;
    private Cookie refreshCookie; // 로그인한 기기의 refresh token

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        String token = verifiedToken(mockMvc, mail, "n1@example.com");
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                .content(withToken("{\"loginId\":\"newuser1\",\"password\":\"Abcdef1!\",\"givenName\":\"길동\",\"familyName\":\"홍\",\"nickname\":\"길동이\",\"email\":\"n1@example.com\"}", token)));
        MockHttpServletResponse login = login("Abcdef1!");
        accessToken = JsonPath.read(login.getContentAsString(), "$.data.accessToken");
        refreshCookie = login.getCookie("refreshToken");
    }

    private MockHttpServletResponse login(String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"newuser1\",\"password\":\"" + password + "\"}"))
                .andReturn().getResponse();
    }

    private ResultActions changePassword(String currentPassword, String newPassword) throws Exception {
        return mockMvc.perform(patch("/api/v1/members/me/password").header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"currentPassword\":\"" + currentPassword + "\",\"newPassword\":\"" + newPassword + "\"}"));
    }

    @Test
    void 비밀번호를_바꾸면_이전_비밀번호로_로그인할_수_없다() throws Exception {
        changePassword("Abcdef1!", "Newpass2@")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").exists());

        assertThat(login("Abcdef1!").getStatus()).isEqualTo(401);
        assertThat(login("Newpass2@").getStatus()).isEqualTo(200);
    }

    @Test
    void 비밀번호를_바꾸면_다른_기기의_로그인이_풀리고_지금_기기는_유지된다() throws Exception {
        Cookie otherDevice = login("Abcdef1!").getCookie("refreshToken");

        Cookie thisDevice = changePassword("Abcdef1!", "Newpass2@")
                .andReturn().getResponse().getCookie("refreshToken");

        // 바꾸기 전에 받은 refresh token은 이 기기·다른 기기 모두 무효
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(otherDevice))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isUnauthorized());
        // 변경 응답으로 받은 새 쿠키로는 계속 로그인 상태
        mockMvc.perform(post("/api/v1/auth/refresh").cookie(thisDevice))
                .andExpect(status().isOk());
    }

    @Test
    void 현재_비밀번호가_틀리면_바꾸지_않는다() throws Exception {
        changePassword("Wrong123!", "Newpass2@")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("CURRENT_PASSWORD_INVALID"))
                .andExpect(jsonPath("$.error.fieldErrors.currentPassword").exists());

        assertThat(login("Abcdef1!").getStatus()).isEqualTo(200);
    }

    @Test
    void 현재_비밀번호를_5번_틀리면_잠긴다() throws Exception {
        for (int i = 0; i < 4; i++) {
            changePassword("Wrong123!", "Newpass2@").andExpect(jsonPath("$.error.code").value("CURRENT_PASSWORD_INVALID"));
        }
        changePassword("Wrong123!", "Newpass2@").andExpect(jsonPath("$.error.code").value("LOGIN_LOCKED"));
        changePassword("Abcdef1!", "Newpass2@").andExpect(jsonPath("$.error.code").value("LOGIN_LOCKED"));
    }

    @Test
    void 새_비밀번호가_규칙에_맞지_않거나_현재와_같으면_400() throws Exception {
        changePassword("Abcdef1!", "short")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fieldErrors.newPassword").exists());
        changePassword("Abcdef1!", "Abcdef1!")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fieldErrors.newPassword").value("현재 비밀번호와 다른 비밀번호를 입력해주세요."));
    }

    @Test
    void 로그인_없이는_비밀번호를_바꿀_수_없다() throws Exception {
        mockMvc.perform(patch("/api/v1/members/me/password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Abcdef1!\",\"newPassword\":\"Newpass2@\"}"))
                .andExpect(status().isUnauthorized());
    }

    private static byte[] image(String format, int width, int height) throws Exception {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, format, out);
        return out.toByteArray();
    }

    private ResultActions upload(byte[] bytes, String fileName, String type)
            throws Exception {
        return mockMvc.perform(multipart(HttpMethod.PATCH, "/api/v1/members/me/profile-image")
                .file(new MockMultipartFile("image", fileName, type, bytes))
                .header("Authorization", "Bearer " + accessToken));
    }

    @Test
    void 로그인_없이는_저장할_수_없다() throws Exception {
        mockMvc.perform(patch("/api/v1/members/me/nickname").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nickname\":\"새닉네임\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_REQUIRED"));
    }

    @Test
    void 닉네임_저장_앞뒤_공백_제거_다국어_허용() throws Exception {
        mockMvc.perform(patch("/api/v1/members/me/nickname").header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"  Nguyễn  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("Nguyễn"))
                .andExpect(jsonPath("$.data.password").doesNotExist());
    }

    @Test
    void 닉네임_규칙_위반은_400() throws Exception {
        for (String bad : new String[]{"A", "a".repeat(21), "ab​cd", "ab\\ncd"}) {
            mockMvc.perform(patch("/api/v1/members/me/nickname").header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"nickname\":\"" + bad + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error.fieldErrors.nickname").exists());
        }
    }

    @Test
    void 이미지_저장_후_로그인_없이_조회할_수_있다() throws Exception {
        String body = upload(image("png", 40, 40), "me.png", "image/png")
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(body, "$.data.profileImageUrl");
        assertThat(url).startsWith("/api/v1/profile-images/").endsWith(".png");

        mockMvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    void 이미지가_아닌_파일은_이름이_png여도_거부() throws Exception {
        upload("<script>alert(1)</script>".getBytes(), "fake.png", "image/png")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_IMAGE"));
    }

    @Test
    void 사용자가_보낸_파일_이름은_쓰지_않는다() throws Exception {
        String body = upload(image("jpg", 20, 20), "../../evil.png", "image/png")
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(body, "$.data.profileImageUrl");
        // 실제 내용(JPG) 기준 확장자, 무작위 이름
        assertThat(url).doesNotContain("evil").endsWith(".jpg");
        try (var files = Files.list(imageDir)) {
            assertThat(files.allMatch(p -> p.getParent().equals(imageDir))).isTrue();
        }
    }

    @Test
    void 용량_4MB_초과는_거부() throws Exception {
        byte[] big = new byte[4 * 1024 * 1024 + 1];
        byte[] png = image("png", 10, 10);
        System.arraycopy(png, 0, big, 0, png.length);
        upload(big, "big.png", "image/png")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_IMAGE"));
    }

    @Test
    void 가로세로가_너무_큰_이미지는_거부() throws Exception {
        upload(image("png", 5000, 1), "wide.png", "image/png")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_IMAGE"));
    }

    @Test
    void 새_이미지를_올리면_이전_이미지_파일은_지운다() throws Exception {
        String first = JsonPath.read(upload(image("png", 10, 10), "a.png", "image/png")
                .andReturn().getResponse().getContentAsString(), "$.data.profileImageUrl");
        String second = JsonPath.read(upload(image("png", 12, 12), "b.png", "image/png")
                .andReturn().getResponse().getContentAsString(), "$.data.profileImageUrl");

        assertThat(second).isNotEqualTo(first);
        mockMvc.perform(get(first)).andExpect(status().isNotFound());
        mockMvc.perform(get(second)).andExpect(status().isOk());
    }

    @Test
    void 이미지_주소로_폴더_밖_파일을_읽을_수_없다() throws Exception {
        int status = mockMvc.perform(get("/api/v1/profile-images/..%2F..%2Fapplication.properties"))
                .andReturn().getResponse().getStatus();
        assertThat(status).isGreaterThanOrEqualTo(400);
    }
}
