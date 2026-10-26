package com.example.forguide.member.mail;

import com.example.forguide.member.service.VerificationPurpose;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Gmail SMTP로 인증 코드 메일을 실제로 보낸다. 외국인 사용자를 고려해 한국어·영어를 함께 쓴다.
 */
public class SmtpVerificationMailSender implements VerificationMailSender {

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpVerificationMailSender(JavaMailSender mailSender, String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void send(String email, String code, VerificationPurpose purpose, long validMinutes) {
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
