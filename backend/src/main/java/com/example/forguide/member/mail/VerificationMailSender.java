package com.example.forguide.member.mail;

import com.example.forguide.member.service.VerificationPurpose;

/**
 * 인증 코드 메일 보내기. 실제 발송(SMTP)과 개발용(로그에만 남김) 두 가지 구현이 있다 (VerificationMailConfig에서 선택).
 */
public interface VerificationMailSender {

    /**
     * @param email   받는 사람
     * @param code    6자리 인증 코드 (원문은 이 메일에만 들어가고 DB에는 해시만 저장된다)
     * @param purpose 회원가입 / 비밀번호 찾기
     * @param validMinutes 코드 유효 시간(분)
     * @throws RuntimeException 발송 실패
     */
    void send(String email, String code, VerificationPurpose purpose, long validMinutes);
}
