package com.example.forguide.member.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import com.example.forguide.member.service.VerificationMailSender;
import com.jayway.jsonpath.JsonPath;
import java.util.Locale;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * 테스트용 이메일 인증 도우미. 메일 발송은 테스트에서 @MockitoBean으로 바꿔 두고, 보낸 코드를 꺼내 쓴다.
 */
final class EmailVerificationSteps {

    private EmailVerificationSteps() {
    }

    /** 이 이메일로 마지막에 보낸 인증 코드 */
    static String lastCode(VerificationMailSender mail, String email) {
        ArgumentCaptor<String> code = ArgumentCaptor.forClass(String.class);
        verify(mail, atLeastOnce()).send(eq(email.trim().toLowerCase(Locale.ROOT)), code.capture(), any(), anyLong());
        return code.getValue();
    }

    /** 가입용(SIGNUP): 코드 보내기 → 코드 확인까지 진행해 인증 완료 토큰을 받는다 */
    static String verifiedToken(MockMvc mockMvc, VerificationMailSender mail, String email) throws Exception {
        return verifiedToken(mockMvc, mail, email, "SIGNUP");
    }

    /** 용도(SIGNUP·PASSWORD_RESET)를 정해 인증 완료 토큰을 받는다 */
    static String verifiedToken(MockMvc mockMvc, VerificationMailSender mail, String email, String purpose)
            throws Exception {
        mockMvc.perform(post("/api/v1/auth/email/send-code").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"purpose\":\"" + purpose + "\"}"));
        String body = mockMvc.perform(post("/api/v1/auth/email/verify").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"purpose\":\"" + purpose + "\",\"code\":\""
                                + lastCode(mail, email) + "\"}"))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.verificationToken");
    }

    /** 가입 JSON 끝에 인증 완료 토큰을 붙인다 */
    static String withToken(String signupJson, String token) {
        return signupJson.substring(0, signupJson.lastIndexOf('}')) + ",\"emailVerificationToken\":\"" + token + "\"}";
    }
}
