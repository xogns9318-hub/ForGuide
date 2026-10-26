package com.example.forguide.member.support;

import com.example.forguide.member.mail.VerificationMailSender;
import com.example.forguide.member.service.VerificationPurpose;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * 테스트용: 인증 메일을 보내지 않고 이메일별 마지막 코드를 기억한다 (테스트에서 코드를 꺼내 확인 단계를 진행)
 */
@TestConfiguration
public class RecordingMailConfig {

    @Bean
    @Primary
    public RecordingMailSender recordingMailSender() {
        return new RecordingMailSender();
    }

    public static class RecordingMailSender implements VerificationMailSender {

        private final Map<String, String> lastCodes = new ConcurrentHashMap<>();
        private volatile boolean failing;

        @Override
        public void send(String email, String code, VerificationPurpose purpose, long validMinutes) {
            if (failing) {
                throw new IllegalStateException("메일 서버 연결 실패(테스트)");
            }
            lastCodes.put(email, code);
        }

        public String lastCode(String email) {
            return lastCodes.get(email);
        }

        public void setFailing(boolean failing) {
            this.failing = failing;
        }
    }
}
