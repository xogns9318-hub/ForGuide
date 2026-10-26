package com.example.forguide.member.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * 인증 메일 발송 방식 선택
 * - MAIL_USERNAME(spring.mail.username)이 있으면 SMTP로 실제 발송
 * - 없으면 개발용으로 서버 로그에만 코드를 남김 (시작할 때 경고 출력)
 */
@Configuration
public class VerificationMailConfig {

    private static final Logger log = LoggerFactory.getLogger(VerificationMailConfig.class);

    @Bean
    public VerificationMailSender verificationMailSender(
            ObjectProvider<JavaMailSender> javaMailSender,
            @Value("${spring.mail.username:}") String username) {

        JavaMailSender sender = javaMailSender.getIfAvailable();
        if (username == null || username.isBlank() || sender == null) {
            log.warn("메일 계정(MAIL_USERNAME)이 없어 인증 코드를 메일 대신 서버 로그에 남깁니다. 배포 환경에서는 설정하세요.");
            return new LogVerificationMailSender();
        }
        return new SmtpVerificationMailSender(sender, username);
    }
}
