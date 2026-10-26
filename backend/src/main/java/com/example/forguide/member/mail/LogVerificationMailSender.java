package com.example.forguide.member.mail;

import com.example.forguide.member.service.VerificationPurpose;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 개발용: 메일 계정(MAIL_USERNAME)이 설정되지 않은 PC에서 실제 발송 대신 서버 로그에 코드를 남긴다.
 * 팀원이 메일 계정 없이도 가입 흐름을 개발·확인할 수 있게 하기 위한 것이며, 배포 환경에서는 반드시 메일 계정을 설정한다.
 */
public class LogVerificationMailSender implements VerificationMailSender {

    private static final Logger log = LoggerFactory.getLogger(LogVerificationMailSender.class);

    @Override
    public void send(String email, String code, VerificationPurpose purpose, long validMinutes) {
        log.warn("[개발용] 메일 계정이 설정되지 않아 인증 메일을 보내지 않았습니다. to={}, purpose={}, code={}",
                email, purpose, code);
    }
}
