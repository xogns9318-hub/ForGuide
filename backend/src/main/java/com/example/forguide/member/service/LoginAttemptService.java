package com.example.forguide.member.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.member.mapper.LoginAttemptMapper;
import com.example.forguide.member.mapper.LoginAttemptRow;
import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

/**
 * 로그인 시도 제한 (비밀번호 무차별 대입 방지)
 *
 * 규칙
 * - 같은 아이디로 연속 5번 실패하면 15분 동안 잠근다. 잠긴 동안은 맞는 비밀번호도 거부한다
 * - 로그인에 성공하면 실패 기록을 지운다
 * - 마지막 실패 후 15분이 지나면 실패 횟수를 처음부터 센다
 * - 가입되지 않은 아이디도 똑같이 센다 (잠김 응답으로 가입 여부가 드러나지 않게)
 *
 * 아이디 형식 확인은 호출하는 쪽(AuthService.login)이 하고, 그 트랜잭션 안에서 실행된다.
 */
@Service
public class LoginAttemptService {

    static final int MAX_FAILURES = 5;
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);
    static final Duration FAILURE_WINDOW = Duration.ofMinutes(15);

    private final LoginAttemptMapper loginAttemptMapper;

    public LoginAttemptService(LoginAttemptMapper loginAttemptMapper) {
        this.loginAttemptMapper = loginAttemptMapper;
    }

    /** 잠겨 있으면 LOGIN_LOCKED. 잠금이 풀렸거나 실패 기록이 오래됐으면 지우고 새로 센다 */
    public void checkNotLocked(String loginId, LocalDateTime now) {
        LoginAttemptRow row = loginAttemptMapper.findByLoginId(loginId);
        if (row == null) {
            return;
        }
        if (row.getLockedUntil() != null && row.getLockedUntil().isAfter(now)) {
            throw new ApiException(ErrorCode.LOGIN_LOCKED);
        }
        boolean lockExpired = row.getLockedUntil() != null;
        boolean failuresStale = row.getLastFailedAt().isBefore(now.minus(FAILURE_WINDOW));
        if (lockExpired || failuresStale) {
            loginAttemptMapper.delete(loginId);
        }
    }

    /** 실패 1회 기록. 이번 실패로 잠기면 LOGIN_LOCKED를 던진다 (5번째 실패부터 잠김 안내) */
    public void recordFailure(String loginId, LocalDateTime now) {
        LocalDateTime lockUntil = now.plus(LOCK_DURATION);
        if (loginAttemptMapper.increaseFailure(loginId, now, MAX_FAILURES, lockUntil) == 0) {
            try {
                loginAttemptMapper.insertFirstFailure(loginId, now);
            } catch (DuplicateKeyException e) {
                // 같은 아이디의 첫 실패가 동시에 들어와 다른 요청이 먼저 행을 만든 경우
                loginAttemptMapper.increaseFailure(loginId, now, MAX_FAILURES, lockUntil);
            }
        }

        LoginAttemptRow row = loginAttemptMapper.findByLoginId(loginId);
        if (row != null && row.getLockedUntil() != null && row.getLockedUntil().isAfter(now)) {
            throw new ApiException(ErrorCode.LOGIN_LOCKED);
        }
    }

    /** 로그인 성공: 실패 기록 삭제 */
    public void reset(String loginId) {
        loginAttemptMapper.delete(loginId);
    }
}
