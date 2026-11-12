package com.example.forguide.member.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.member.mapper.EmailVerificationMapper;
import com.example.forguide.member.mapper.EmailVerificationRow;
import com.example.forguide.member.mapper.MemberMapper;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 이메일 인증 (회원가입·비밀번호 찾기 공통)
 *
 * 흐름: 코드 보내기(sendCode) → 코드 확인(verify)하면 인증 완료 토큰 발급 → 가입 등에서 토큰 사용(consume, 한 번만)
 *
 * 규칙
 * - 코드: 6자리 숫자, 10분 유효, 5번 틀리면 무효(새 코드 필요)
 * - 재발송: 같은 이메일·목적은 1분 간격, 하루(24시간) 10번까지
 * - 전체 상한: 모든 주소를 합쳐 하루(날짜 기준)에 실제로 보내는 메일 수 (forguide.mail.daily-total-limit)
 *   주소를 바꿔 가며 보내는 남용으로 발송 계정(Gmail) 한도가 바닥나거나 계정이 정지되는 것을 막는다
 * - 인증 완료 토큰: 무작위 32바이트, 30분 유효, 한 번만 사용
 * - 보안: 코드와 토큰은 원문이 아니라 SHA-256 해시만 저장하고, 비교는 시간 차이가 나지 않는 방식으로 한다
 */
@Service
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);

    static final Duration CODE_TTL = Duration.ofMinutes(10);
    static final Duration RESEND_INTERVAL = Duration.ofSeconds(60);
    static final int DAILY_LIMIT = 10;
    static final int MAX_ATTEMPTS = 5;
    static final Duration TOKEN_TTL = Duration.ofMinutes(30);
    private static final int TOKEN_BYTES = 32;

    private final EmailVerificationMapper verificationMapper;
    private final MemberMapper memberMapper;
    private final VerificationMailSender mailSender;

    // 전체 발송 상한: 오늘 실제로 보낸(보내는 중인) 메일 수
    // 서버 메모리에만 두므로 서버를 다시 켜면 0부터 다시 센다 (서버 한 대 기준, 재시작은 드물어 감수)
    // DB 기록 수로 세지 않는 이유: 계정 찾기에서 가입되지 않은 주소는 기록만 남기고 메일은 보내지 않기 때문
    private final int dailyTotalLimit;
    private LocalDate sentDate = LocalDate.now();
    private int sentToday = 0;

    public EmailVerificationService(EmailVerificationMapper verificationMapper, MemberMapper memberMapper,
                                    VerificationMailSender mailSender,
                                    @Value("${forguide.mail.daily-total-limit:300}") int dailyTotalLimit) {
        this.verificationMapper = verificationMapper;
        this.memberMapper = memberMapper;
        this.mailSender = mailSender;
        this.dailyTotalLimit = dailyTotalLimit;
    }

    /** 발송 결과: 코드 유효 시간과 다음 재발송까지 기다릴 시간(초) */
    public record SendResult(long expiresInSeconds, long resendAfterSeconds) {
    }

    /** 인증 코드 보내기 */
    @Transactional
    public SendResult sendCode(String rawEmail, VerificationPurpose purpose) {
        String email = normalize(rawEmail);
        LocalDateTime now = LocalDateTime.now();

        // 가입용: 이미 가입된 이메일이면 코드를 보내지 않는다 (가입 단계의 중복 확인과 같은 안내)
        boolean registered = memberMapper.existsByEmail(email);
        if (purpose == VerificationPurpose.SIGNUP && registered) {
            throw new ApiException(ErrorCode.EMAIL_DUPLICATED,
                    Map.of("email", ErrorCode.EMAIL_DUPLICATED.getDefaultMessage()));
        }

        // 재발송 간격과 하루 한도 (메일 폭탄·발송 계정 남용 방지)
        EmailVerificationRow latest = verificationMapper.findLatest(email, purpose.name());
        if (latest != null && latest.getCreatedAt().isAfter(now.minus(RESEND_INTERVAL))) {
            throw new ApiException(ErrorCode.VERIFICATION_RESEND_TOO_SOON);
        }
        if (verificationMapper.countSentSince(email, purpose.name(), now.minusHours(24)) >= DAILY_LIMIT) {
            throw new ApiException(ErrorCode.VERIFICATION_DAILY_LIMIT);
        }

        // 전체 상한에 닿았으면 목적·가입 여부와 상관없이 같은 안내로 막는다 (계정 찾기로 가입 여부를 알 수 없게)
        if (isDailyTotalReached()) {
            log.warn("인증 메일 하루 전체 상한({}통)에 도달해 발송을 막았습니다.", dailyTotalLimit);
            throw new ApiException(ErrorCode.VERIFICATION_DAILY_LIMIT);
        }

        String code = SecureTokens.sixDigits();
        EmailVerificationRow row = new EmailVerificationRow();
        row.setEmail(email);
        row.setPurpose(purpose.name());
        row.setCodeHash(codeHash(email, code));
        row.setExpiresAt(now.plus(CODE_TTL));
        row.setCreatedAt(now);
        verificationMapper.insert(row);

        // 계정 찾기(비밀번호 재설정·아이디 찾기): 가입되지 않은 이메일이면 기록만 남기고 실제로 보내지 않는다
        // 응답·재발송 간격·하루 한도는 가입된 이메일과 같게 둬서, 이 화면으로 가입 여부를 알아낼 수 없게 한다
        // (메일 발송 시간만큼 응답 시간은 다를 수 있다)
        if (purpose != VerificationPurpose.SIGNUP && !registered) {
            return new SendResult(CODE_TTL.toSeconds(), RESEND_INTERVAL.toSeconds());
        }

        // 전체 상한 한 칸을 먼저 잡는다 (동시에 여러 요청이 와도 상한을 넘지 않게). 이미 다 찼으면 막는다
        if (!reserveDailySend()) {
            log.warn("인증 메일 하루 전체 상한({}통)에 도달해 발송을 막았습니다.", dailyTotalLimit);
            throw new ApiException(ErrorCode.VERIFICATION_DAILY_LIMIT);
        }

        // 발송에 실패하면 예외로 기록 저장도 되돌린다 (보내지 못한 코드가 재발송 간격을 막지 않게)
        // 잡아 둔 상한 한 칸도 돌려준다 (보내지 못한 메일은 세지 않는다)
        try {
            mailSender.send(email, code, purpose, CODE_TTL.toMinutes());
        } catch (RuntimeException e) {
            releaseDailySend();
            log.error("인증 메일 발송 실패: purpose={}", purpose, e);
            throw new ApiException(ErrorCode.MAIL_SEND_FAILED);
        }

        return new SendResult(CODE_TTL.toSeconds(), RESEND_INTERVAL.toSeconds());
    }

    // 날짜가 바뀌었으면 오늘 보낸 수를 0으로 되돌린다 (아래 synchronized 메서드 안에서만 부른다)
    private void rollDate() {
        LocalDate today = LocalDate.now();
        if (!today.equals(sentDate)) {
            sentDate = today;
            sentToday = 0;
        }
    }

    // 오늘 전체 상한에 닿았는지 (보내기 전 미리 확인)
    private synchronized boolean isDailyTotalReached() {
        rollDate();
        return sentToday >= dailyTotalLimit;
    }

    // 오늘 보낼 수 있으면 한 칸 잡고 true, 상한이면 false
    private synchronized boolean reserveDailySend() {
        rollDate();
        if (sentToday >= dailyTotalLimit) return false;
        sentToday++;
        return true;
    }

    // 발송에 실패한 한 칸 돌려주기
    private synchronized void releaseDailySend() {
        if (sentToday > 0) sentToday--;
    }

    /**
     * 인증 코드 확인 → 성공하면 인증 완료 토큰(원문)을 돌려준다
     * 틀린 횟수는 오류를 던져도 저장되어야 하므로 ApiException에는 되돌리지 않는다
     */
    @Transactional(noRollbackFor = ApiException.class)
    public String verify(String rawEmail, VerificationPurpose purpose, String code) {
        String email = normalize(rawEmail);
        LocalDateTime now = LocalDateTime.now();

        // 가장 최근 코드만 유효 (새 코드를 받으면 이전 코드는 쓸 수 없다)
        EmailVerificationRow latest = verificationMapper.findLatest(email, purpose.name());
        if (latest == null || latest.getVerifiedAt() != null || !latest.getExpiresAt().isAfter(now)) {
            throw new ApiException(ErrorCode.VERIFICATION_EXPIRED);
        }
        if (latest.getFailedAttempts() >= MAX_ATTEMPTS) {
            throw new ApiException(ErrorCode.VERIFICATION_ATTEMPTS_EXCEEDED);
        }

        String input = code == null ? "" : code.trim();
        if (!SecureTokens.matches(latest.getCodeHash(), codeHash(email, input))) {
            verificationMapper.increaseFailedAttempts(latest.getVerificationId());
            if (latest.getFailedAttempts() + 1 >= MAX_ATTEMPTS) {
                throw new ApiException(ErrorCode.VERIFICATION_ATTEMPTS_EXCEEDED);
            }
            throw new ApiException(ErrorCode.VERIFICATION_CODE_INVALID,
                    Map.of("code", ErrorCode.VERIFICATION_CODE_INVALID.getDefaultMessage()));
        }

        String token = SecureTokens.random(TOKEN_BYTES);
        verificationMapper.markVerified(latest.getVerificationId(), now, SecureTokens.sha256(token), now.plus(TOKEN_TTL));
        return token;
    }

    /**
     * 인증 완료 토큰 사용 (가입·비밀번호 재설정에서 호출). 이메일·목적이 맞고, 만료 전이고, 처음 쓰는 토큰이어야 한다.
     * 호출한 쪽의 트랜잭션 안에서 실행되므로, 가입이 실패하면 토큰 사용도 함께 되돌려진다.
     */
    public void consume(String rawEmail, VerificationPurpose purpose, String token) {
        if (token == null || token.isBlank()) {
            throw notVerified();
        }
        String email = normalize(rawEmail);
        LocalDateTime now = LocalDateTime.now();

        EmailVerificationRow row = verificationMapper.findByTokenHash(SecureTokens.sha256(token.trim()));
        boolean valid = row != null
                && row.getEmail().equals(email)
                && row.getPurpose().equals(purpose.name())
                && row.getTokenUsedAt() == null
                && row.getTokenExpiresAt() != null
                && row.getTokenExpiresAt().isAfter(now);

        // 바뀐 행이 1개일 때만 성공 → 같은 토큰을 동시에 두 번 써도 한 번만 성공
        if (!valid || verificationMapper.markTokenUsed(row.getVerificationId(), now) != 1) {
            throw notVerified();
        }
    }

    private static ApiException notVerified() {
        return new ApiException(ErrorCode.EMAIL_NOT_VERIFIED,
                Map.of("email", ErrorCode.EMAIL_NOT_VERIFIED.getDefaultMessage()));
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    // 코드는 이메일과 묶어 해시한다 (같은 코드라도 이메일마다 해시가 다르다)
    private static String codeHash(String email, String code) {
        return SecureTokens.sha256(email + ":" + code);
    }
}
