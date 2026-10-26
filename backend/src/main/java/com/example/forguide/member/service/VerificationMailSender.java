package com.example.forguide.member.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * 인증 코드 메일 보내기
 * - MAIL_USERNAME(spring.mail.username)이 있으면 Gmail SMTP로 실제 발송 (한국어·영어 함께)
 * - 없으면 개발용으로 서버 로그에만 코드를 남긴다. 팀원이 메일 계정 없이도 가입 흐름을 확인할 수 있게 하기 위한 것이며,
 *   배포 환경에서는 반드시 메일 계정을 설정한다 (시작할 때 경고 출력)
 */
@Component
public class VerificationMailSender {

    private static final Logger log = LoggerFactory.getLogger(VerificationMailSender.class);

    private final JavaMailSender mailSender; // 메일 계정이 없으면 null
    private final String from;

    public VerificationMailSender(ObjectProvider<JavaMailSender> mailSender,
                                  @Value("${spring.mail.username:}") String from) {
        boolean configured = from != null && !from.isBlank();
        this.mailSender = configured ? mailSender.getIfAvailable() : null;
        this.from = from;
        if (this.mailSender == null) {
            log.warn("메일 계정(MAIL_USERNAME)이 없어 인증 코드를 메일 대신 서버 로그에 남깁니다. 배포 환경에서는 설정하세요.");
        }
    }

    /**
     * @param code 6자리 인증 코드 (원문은 이 메일에만 들어가고 DB에는 해시만 저장된다)
     * @throws RuntimeException 발송 실패
     */
    public void send(String email, String code, VerificationPurpose purpose, long validMinutes) {
        if (mailSender == null) {
            log.warn("[개발용] 메일 계정이 설정되지 않아 인증 메일을 보내지 않았습니다. to={}, purpose={}, code={}",
                    email, purpose, code);
            return;
        }

        String what = purpose == VerificationPurpose.SIGNUP ? "회원가입" : "비밀번호 재설정";
        String whatEn = purpose == VerificationPurpose.SIGNUP ? "sign-up" : "password reset";

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("[ForGuide] 인증 코드 / Verification code: " + code);
        message.setText("""
                ForGuide %s 인증 코드입니다.
                Your ForGuide %s verification code is:

                %s

                이 코드는 %d분 동안 유효합니다. / This code is valid for %d minutes.
                직접 요청하지 않았다면 이 메일을 무시하세요. / If you did not request this, please ignore this email.
                """.formatted(what, whatEn, code, validMinutes, validMinutes));

        mailSender.send(message);
    }
}
