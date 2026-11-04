package com.example.forguide.chatbot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.forguide.common.security.JwtProvider;
import com.jayway.jsonpath.JsonPath;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlConfig;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

/**
 * 챗봇 API. 키가 있는 상태로 띄우고 OpenAI 대신 FakeChatModel을 쓴다 (실제 호출 없음).
 * 사용 횟수가 서버 메모리에 남으므로, 하루 한도 테스트는 다른 테스트가 쓰지 않는 회원(9번)으로 한다.
 */
@SpringBootTest(properties = "spring.ai.openai.api-key=test-only-key")
@Import(ChatbotControllerTest.FakeModelConfig.class)
@Sql(
        scripts = {"/member/schema.sql", "/security/security-members.sql"},
        config = @SqlConfig(encoding = "UTF-8")
)
class ChatbotControllerTest {

    private static final String URL = "/api/v1/chatbot/messages";

    private static final String PII_QUESTION = "주민번호 900101-1234567, 외국인등록번호 950505-6123456, "
            + "여권 M12345678, 계좌 123-456789-01-234, 전화 010-1234-5678 입니다";
    private static final String PII_MASKED = "주민번호 ******-*******, 외국인등록번호 ******-*******, "
            + "여권 *********, 계좌 ***-******-**-***, 전화 ***-****-**** 입니다";

    @TestConfiguration
    static class FakeModelConfig {
        @Bean
        @Primary
        FakeChatModel fakeChatModel() {
            return new FakeChatModel();
        }
    }

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private FakeChatModel fakeChatModel;

    @Autowired
    private ChatModel chatModel;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        fakeChatModel.prompts.clear();
        fakeChatModel.nextFailure = null;
        // 회원 7번의 대화를 비우고 시작한다
        mockMvc.perform(delete(URL).header("Authorization", bearer(7L))).andExpect(status().isOk());
    }

    @Test
    void 가짜_모델이_실제_OpenAI_대신_연결된다() {
        assertThat(chatModel).isSameAs(fakeChatModel);
    }

    @Test
    void 로그인하지_않으면_401_AUTH_REQUIRED() throws Exception {
        mockMvc.perform(get(URL))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_REQUIRED"));
        mockMvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(body("안녕하세요")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_REQUIRED"));
        mockMvc.perform(delete(URL))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("AUTH_REQUIRED"));

        assertThat(fakeChatModel.prompts).isEmpty();
    }

    @Test
    void 질문하면_답이_오고_다시_열어도_최근_대화가_보인다() throws Exception {
        ask(7L, "대출 상품은 어디서 보나요?")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.question.role").value("USER"))
                .andExpect(jsonPath("$.data.answer.role").value("ASSISTANT"))
                .andExpect(jsonPath("$.data.answer.content").value(FakeChatModel.ANSWER));

        mockMvc.perform(get(URL).header("Authorization", bearer(7L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.dailyLimit").value(30))
                .andExpect(jsonPath("$.data.maxQuestionLength").value(500))
                .andExpect(jsonPath("$.data.messages.length()").value(2))
                .andExpect(jsonPath("$.data.messages[0].content").value("대출 상품은 어디서 보나요?"))
                .andExpect(jsonPath("$.data.messages[1].content").value(FakeChatModel.ANSWER));
    }

    @Test
    void 이전_대화를_함께_보내고_시스템_프롬프트에_화면_언어를_넣는다() throws Exception {
        ask(7L, "첫 번째 질문").andExpect(status().isOk());
        mockMvc.perform(post(URL)
                        .header("Authorization", bearer(7L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("question", "second question", "language", "vi"))))
                .andExpect(status().isOk());

        assertThat(fakeChatModel.lastPromptText())
                .contains("첫 번째 질문", FakeChatModel.ANSWER, "second question", "Vietnamese");
    }

    @Test
    void OpenAI로_가는_내용과_대화_기록에는_개인정보가_가려져_있다() throws Exception {
        ask(7L, PII_QUESTION)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.question.content").value(PII_MASKED));

        assertThat(fakeChatModel.lastPromptText())
                .contains(PII_MASKED)
                .doesNotContain("900101-1234567", "950505-6123456", "M12345678",
                        "123-456789-01-234", "010-1234-5678");

        mockMvc.perform(get(URL).header("Authorization", bearer(7L)))
                .andExpect(jsonPath("$.data.messages[0].content").value(PII_MASKED));
    }

    @Test
    void 질문이_500자를_넘으면_400_CHATBOT_QUESTION_TOO_LONG() throws Exception {
        ask(7L, "가".repeat(500)).andExpect(status().isOk());

        ask(7L, "가".repeat(501))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CHATBOT_QUESTION_TOO_LONG"))
                .andExpect(jsonPath("$.error.message").value("질문은 500자 이하로 입력해주세요."));

        assertThat(fakeChatModel.prompts).hasSize(1);
    }

    @Test
    void 빈_질문은_400_INVALID_INPUT() throws Exception {
        ask(7L, "   ")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"));
    }

    @Test
    void 하루_30번을_넘는_31번째_질문은_429_CHATBOT_DAILY_LIMIT() throws Exception {
        for (int count = 1; count <= 30; count++) {
            ask(9L, "질문 " + count)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.remainingToday").value(30 - count));
        }

        ask(9L, "질문 31")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CHATBOT_DAILY_LIMIT"));

        assertThat(fakeChatModel.prompts).hasSize(30);
        mockMvc.perform(get(URL).header("Authorization", bearer(9L)))
                .andExpect(jsonPath("$.data.remainingToday").value(0))
                // 최근 10개만 기억한다 (질문 5개 + 답변 5개)
                .andExpect(jsonPath("$.data.messages.length()").value(10));
    }

    @Test
    void OpenAI_호출이_실패하면_502_CHATBOT_FAILED이고_횟수와_질문을_되돌린다() throws Exception {
        int before = remaining(7L);
        fakeChatModel.nextFailure = new IllegalStateException("OpenAI 연결 실패(테스트)");

        ask(7L, "실패할 질문")
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.error.code").value("CHATBOT_FAILED"));

        mockMvc.perform(get(URL).header("Authorization", bearer(7L)))
                .andExpect(jsonPath("$.data.remainingToday").value(before))
                .andExpect(jsonPath("$.data.messages.length()").value(0));
    }

    @Test
    void 대화를_지우면_기록이_비워진다() throws Exception {
        ask(7L, "지울 질문").andExpect(status().isOk());

        mockMvc.perform(delete(URL).header("Authorization", bearer(7L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get(URL).header("Authorization", bearer(7L)))
                .andExpect(jsonPath("$.data.messages.length()").value(0));
    }

    private ResultActions ask(Long memberId, String question) throws Exception {
        return mockMvc.perform(post(URL)
                .header("Authorization", bearer(memberId))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(question)));
    }

    private int remaining(Long memberId) throws Exception {
        String json = mockMvc.perform(get(URL).header("Authorization", bearer(memberId)))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.data.remainingToday");
    }

    private String body(String question) throws Exception {
        return objectMapper.writeValueAsString(Map.of("question", question, "language", "ko"));
    }

    private String bearer(Long memberId) {
        return "Bearer " + jwtProvider.createAccessToken(memberId);
    }
}
