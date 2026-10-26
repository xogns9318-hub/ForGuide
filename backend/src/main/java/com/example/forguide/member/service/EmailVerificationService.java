package com.example.forguide.member.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.member.mail.VerificationMailSender;
import com.example.forguide.member.mapper.EmailVerificationMapper;
import com.example.forguide.member.mapper.EmailVerificationRow;
import com.example.forguide.member.mapper.MemberMapper;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private final SecureRandom secureRandom = new SecureRandom();

    public EmailVerificationService(EmailVerificationMapper verificationMapper, MemberMapper memberMapper,
                                    VerificationMailSender mailSender) {
        this.verificationMapper = verificationMapper;
        this.memberMapper = memberMapper;
        this.mailSender = mailSender;
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
        if (purpose == VerificationPurpose.SIGNUP && memberMapper.existsByEmail(email)) {
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

        String code = newCode();
        EmailVerificationRow row = new EmailVerificationRow();
        row.setEmail(email);
        row.setPurpose(purpose.name());
        row.setCodeHash(codeHash(email, code));
        row.setExpiresAt(now.plus(CODE_TTL));
        row.setCreatedAt(now);
        verificationMapper.insert(row);

        // 발송에 실패하면 예외로 기록 저장도 되돌린다 (보내지 못한 코드가 재발송 간격을 막지 않게)
        try {
            mailSender.send(email, code, purpose, CODE_TTL.toMinutes());
        } catch (RuntimeException e) {
            log.error("인증 메일 발송 실패: purpose={}", purpose, e);
            throw new ApiException(ErrorCode.MAIL_SEND_FAILED);
        }

        return new SendResult(CODE_TTL.toSeconds(), RESEND_INTERVAL.toSeconds());
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
        if (!constantTimeEquals(latest.getCodeHash(), codeHash(email, input))) {
            verificationMapper.increaseFailedAttempts(latest.getVerificationId());
            if (latest.getFailedAttempts() + 1 >= MAX_ATTEMPTS) {
                throw new ApiException(ErrorCode.VERIFICATION_ATTEMPTS_EXCEEDED);
            }
            throw new ApiException(ErrorCode.VERIFICATION_CODE_INVALID,
                    Map.of("code", ErrorCode.VERIFICATION_CODE_INVALID.getDefaultMessage()));
        }

        String token = newToken();
        verificationMapper.markVerified(latest.getVerificationId(), now, sha256(token), now.plus(TOKEN_TTL));
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

        EmailVerificationRow row = verificationMapper.findByTokenHash(sha256(token.trim()));
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

    // 000000~999999 (앞자리 0 포함 6자리)
    private String newCode() {
        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    private String newToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // 코드는 이메일과 묶어 해시한다 (같은 코드라도 이메일마다 해시가 다르다)
    private static String codeHash(String email, String code) {
        return sha256(email + ":" + code);
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", e);
        }
    }
}
