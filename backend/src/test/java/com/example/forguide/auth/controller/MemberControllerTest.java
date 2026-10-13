package com.example.forguide.auth.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * 닉네임·프로필 이미지 저장과 이미지 주소 공개 (테스트 DB: H2, 이미지는 임시 폴더)
 */
@SpringBootTest
@Sql(scripts = "/auth/schema.sql")
class MemberControllerTest {

    @TempDir
    static Path imageDir;

    @DynamicPropertySource
    static void imageDirProperty(DynamicPropertyRegistry registry) {
        registry.add("forguide.profile-image.dir", () -> imageDir.toString());
    }

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                .content("{\"loginId\":\"newuser1\",\"password\":\"Abcdef1!\",\"name\":\"홍길동\",\"email\":\"n1@example.com\"}"));
        String body = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"loginId\":\"newuser1\",\"password\":\"Abcdef1!\"}"))
                .andReturn().getResponse().getContentAsString();
        accessToken = JsonPath.read(body, "$.data.accessToken");
    }

    private static byte[] image(String format, int width, int height) throws Exception {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(img, format, out);
        return out.toByteArray();
    }

    private org.springframework.test.web.servlet.ResultActions upload(byte[] bytes, String fileName, String type)
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
