package com.example.forguide.chatbot;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.forguide.common.security.JwtProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

/**
 * 키가 없는 상태(no-key). 서버는 켜지고, 챗봇만 '사용할 수 없음'으로 응답한다.
 */
@SpringBootTest
@Sql(
        scripts = {"/member/schema.sql", "/security/security-members.sql"},
        config = @SqlConfig(encoding = "UTF-8")
)
class ChatbotNoKeyTest {

    private static final String URL = "/api/v1/chatbot/messages";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtProvider jwtProvider;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void 키가_없으면_화면에_사용할_수_없음을_알린다() throws Exception {
        mockMvc.perform(get(URL).header("Authorization", "Bearer " + jwtProvider.createAccessToken(7L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.messages.length()").value(0));
    }

    @Test
    void 키가_없으면_질문은_503_CHATBOT_UNAVAILABLE() throws Exception {
        mockMvc.perform(post(URL)
                        .header("Authorization", "Bearer " + jwtProvider.createAccessToken(7L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"안녕하세요\",\"language\":\"ko\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CHATBOT_UNAVAILABLE"));
    }
}
