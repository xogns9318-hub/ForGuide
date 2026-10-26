package com.example.forguide.recommend;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest
class RecommendControllerTest {

    private static final String STATUS = "유학생";

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void accountFastWithoutLogin() throws Exception {
        mockMvc.perform(get("/api/v1/recommend/account/fast")
                        .param("residence_status", STATUS).param("purpose", "적금").param("term", "12")
                        .param("visit", "원치 않음").param("institution", "은행 선호"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.input.purpose").value("적금"))
                .andExpect(jsonPath("$.data.input.term").value(12))
                .andExpect(jsonPath("$.data.groups").isArray());
    }

    @Test
    void accountChoicesComeFromServingFile() throws Exception {
        mockMvc.perform(get("/api/v1/recommend/account/choices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.key_order[1]").value("term"))
                .andExpect(jsonPath("$.data.choices.term[3]").value(36))
                .andExpect(jsonPath("$.data.residence_status[3]").value(STATUS));
    }

    @Test
    void accountFastRejectsUnknownValues() throws Exception {
        mockMvc.perform(get("/api/v1/recommend/account/fast")
                        .param("residence_status", "관광").param("purpose", "예금").param("term", "5")
                        .param("visit", "상관없음"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INPUT"))
                .andExpect(jsonPath("$.error.fieldErrors.residence_status").exists())
                .andExpect(jsonPath("$.error.fieldErrors.term").value("허용값: 6, 12, 24, 36"))
                .andExpect(jsonPath("$.error.fieldErrors.institution").exists())
                .andExpect(jsonPath("$.error.fieldErrors.purpose").doesNotExist());
    }

    @Test
    void insuranceFastUsesSexAndAge() throws Exception {
        mockMvc.perform(get("/api/v1/recommend/insurance/fast")
                        .param("health_insurance", "예").param("residence_status", STATUS)
                        .param("sex", "여").param("age", "35"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.input.sex").value("여"))
                .andExpect(jsonPath("$.data.input.age").value(35));
    }

    @Test
    void insuranceGateRedirectsToConsultation() throws Exception {
        mockMvc.perform(get("/api/v1/recommend/insurance/fast").param("health_insurance", "모름"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.redirect").value("consultation"));
    }

    @Test
    void insuranceAgeOutOfRange() throws Exception {
        mockMvc.perform(get("/api/v1/recommend/insurance/fast")
                        .param("health_insurance", "예").param("residence_status", STATUS)
                        .param("sex", "남").param("age", "18"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.fieldErrors.age").value("허용값: 19~99"));
    }

    @Test
    void loanFast() throws Exception {
        mockMvc.perform(get("/api/v1/recommend/loan/fast")
                        .param("residence_status", STATUS).param("purpose", "전세 보증금").param("visit", "원치 않음"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.loan_type").value("jeonse"))
                .andExpect(jsonPath("$.data.input.visit").value("원치 않음"));
    }
}
