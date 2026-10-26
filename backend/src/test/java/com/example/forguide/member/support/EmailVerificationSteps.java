package com.example.forguide.member.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.example.forguide.member.support.RecordingMailConfig.RecordingMailSender;
import com.jayway.jsonpath.JsonPath;
import java.util.Locale;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/** 테스트용: 코드 보내기 → 코드 확인까지 진행해 인증 완료 토큰을 받는다 */
public final class EmailVerificationSteps {

    private EmailVerificationSteps() {
    }

    public static String verifiedToken(MockMvc mockMvc, RecordingMailSender mail, String email) throws Exception {
        mockMvc.perform(post("/api/v1/auth/email/send-code").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"purpose\":\"SIGNUP\"}"));
        String code = mail.lastCode(email.trim().toLowerCase(Locale.ROOT));
        String body = mockMvc.perform(post("/api/v1/auth/email/verify").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"purpose\":\"SIGNUP\",\"code\":\"" + code + "\"}"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.verificationToken");
    }

    /** 가입 JSON 끝에 인증 완료 토큰을 붙인다 */
    public static String withToken(String signupJson, String token) {
        return signupJson.substring(0, signupJson.lastIndexOf('}')) + ",\"emailVerificationToken\":\"" + token + "\"}";
    }
}
