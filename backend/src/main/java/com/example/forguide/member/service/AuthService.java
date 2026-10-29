package com.example.forguide.member.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.common.security.JwtProvider;
import com.example.forguide.member.dto.AuthResponse;
import com.example.forguide.member.dto.LoginRequest;
import com.example.forguide.member.dto.MemberResponse;
import com.example.forguide.member.dto.PasswordChangeRequest;
import com.example.forguide.member.dto.PasswordResetRequest;
import com.example.forguide.member.dto.PasswordResetResponse;
import com.example.forguide.member.dto.SignupRequest;
import com.example.forguide.member.mapper.MemberMapper;
import com.example.forguide.member.mapper.MemberRow;
import com.example.forguide.member.mapper.RefreshTokenMapper;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원가입·로그인·재발급·로그아웃·비밀번호 변경·비밀번호 찾기.
 *
 * refresh token 규칙
 * - 원문은 무작위 32바이트, 쿠키로만 내려준다
 * - DB에는 SHA-256 해시만 저장한다 (DB가 유출돼도 그대로 쓸 수 있는 토큰이 나오지 않게)
 * - 재발급할 때마다 바꾼다(rotation). 한 번 쓴 토큰은 다시 쓸 수 없다
 */
@Service
public class AuthService {

    private static final Pattern LOGIN_ID_PATTERN = Pattern.compile("^[a-z0-9]{4,20}$");
    private static final int REFRESH_TOKEN_BYTES = 32;

    private final MemberMapper memberMapper;
    private final RefreshTokenMapper refreshTokenMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final EmailVerificationService emailVerificationService;
    private final LoginAttemptService loginAttemptService;

    // 없는 아이디로 로그인할 때도 비밀번호 비교 시간을 똑같이 쓰기 위한 가짜 해시
    // (응답 시간 차이로 "가입된 아이디인지"를 알아내지 못하게 한다)
    private final String dummyPasswordHash;

    public AuthService(MemberMapper memberMapper, RefreshTokenMapper refreshTokenMapper,
                       PasswordEncoder passwordEncoder, JwtProvider jwtProvider,
                       EmailVerificationService emailVerificationService,
                       LoginAttemptService loginAttemptService) {
        this.memberMapper = memberMapper;
        this.refreshTokenMapper = refreshTokenMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
        this.emailVerificationService = emailVerificationService;
        this.loginAttemptService = loginAttemptService;
        this.dummyPasswordHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    /** 아이디 중복 확인 */
    public boolean isLoginIdAvailable(String loginId) {
        if (loginId == null || !LOGIN_ID_PATTERN.matcher(loginId).matches()) {
            String message = "4~20자의 영문 소문자와 숫자만 사용할 수 있습니다.";
            throw new ApiException(ErrorCode.INVALID_INPUT, message, Map.of("loginId", message));
        }
        return !memberMapper.existsByLoginId(loginId);
    }

    /** 회원가입 → 가입한 회원 정보 */
    @Transactional
    public MemberResponse signup(SignupRequest request) {
        // 이메일은 대소문자를 구분하지 않고 비교·저장, 이름·성·닉네임은 앞뒤 공백 제거
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        String givenName = request.givenName().trim();
        String familyName = request.familyName() == null ? "" : request.familyName().trim();

        // 닉네임은 닉네임 변경과 같은 규칙으로 검사한다
        String nickname = NicknamePolicy.normalize(request.nickname());
        String nicknameProblem = NicknamePolicy.check(nickname);
        if (nicknameProblem != null) {
            throw new ApiException(ErrorCode.INVALID_INPUT, nicknameProblem, Map.of("nickname", nicknameProblem));
        }

        if (memberMapper.existsByLoginId(request.loginId())) {
            throw duplicated(ErrorCode.LOGIN_ID_DUPLICATED, "loginId");
        }
        if (memberMapper.existsByEmail(email)) {
            throw duplicated(ErrorCode.EMAIL_DUPLICATED, "email");
        }

        // 이 이메일로 인증을 마쳤는지 확인하고 토큰을 사용 처리한다 (한 번만 쓸 수 있음)
        // 아래 저장이 실패하면 같은 트랜잭션이라 토큰 사용도 되돌려져 다시 가입을 시도할 수 있다
        emailVerificationService.consume(email, VerificationPurpose.SIGNUP, request.emailVerificationToken());

        MemberRow row = new MemberRow();
        row.setLoginId(request.loginId());
        row.setPassword(passwordEncoder.encode(request.password())); // BCrypt 해시만 저장
        // 화면 표시용 이름은 "이름 성" 순서 (성이 없으면 이름만)
        row.setName(familyName.isEmpty() ? givenName : givenName + " " + familyName);
        row.setGivenName(givenName);
        row.setFamilyName(familyName.isEmpty() ? null : familyName);
        row.setNickname(nickname);
        row.setEmail(email);

        try {
            memberMapper.insert(row);
        } catch (DuplicateKeyException e) {
            // 위 확인과 저장 사이에 다른 사람이 먼저 가입한 경우 (DB UNIQUE가 막음)
            throw memberMapper.existsByLoginId(request.loginId())
                    ? duplicated(ErrorCode.LOGIN_ID_DUPLICATED, "loginId")
                    : duplicated(ErrorCode.EMAIL_DUPLICATED, "email");
        }

        return MemberResponse.from(memberMapper.findById(row.getMemberId()));
    }

    /**
     * 로그인 → access token + refresh token
     * 실패 기록은 오류를 던져도 저장되어야 하므로 ApiException에는 되돌리지 않는다
     */
    @Transactional(noRollbackFor = ApiException.class)
    public AuthTokens login(LoginRequest request) {
        LocalDateTime now = LocalDateTime.now();
        String loginId = request.loginId();

        // 아이디 형식에 맞지 않으면 가입될 수 없는 아이디이므로 실패 횟수를 세지 않는다
        boolean trackAttempts = LOGIN_ID_PATTERN.matcher(loginId).matches();

        // 잠긴 아이디는 비밀번호를 확인하지 않고 거부한다 (맞는 비밀번호여도)
        if (trackAttempts) {
            loginAttemptService.checkNotLocked(loginId, now);
        }

        MemberRow member = memberMapper.findByLoginId(loginId);

        // 회원이 없어도 비교는 한다 (시간 차이로 가입 여부가 드러나지 않게)
        String hash = (member != null) ? member.getPassword() : dummyPasswordHash;
        boolean matches = passwordEncoder.matches(request.password(), hash);

        // 보안: 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않는다
        if (member == null || !matches) {
            // 실패 횟수를 세고, 이번이 5번째면 LOGIN_LOCKED로 바로 알린다
            if (trackAttempts) {
                loginAttemptService.recordFailure(loginId, now);
            }
            throw new ApiException(ErrorCode.LOGIN_FAILED);
        }

        loginAttemptService.reset(loginId);
        return issueTokens(member);
    }

    /** 재발급: 쓴 refresh token은 지우고 새로 발급한다 (rotation) */
    @Transactional
    public AuthTokens refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException(ErrorCode.REFRESH_INVALID);
        }
        String tokenHash = SecureTokens.sha256(refreshToken);

        Long memberId = refreshTokenMapper.findMemberIdByValidToken(tokenHash, LocalDateTime.now());

        // 지우기에 성공한 요청만 새 토큰을 받는다 → 같은 토큰으로 동시에 두 번 재발급해도 한 번만 성공
        int deleted = refreshTokenMapper.deleteByToken(tokenHash);
        if (memberId == null || deleted == 0) {
            throw new ApiException(ErrorCode.REFRESH_INVALID);
        }

        MemberRow member = memberMapper.findById(memberId);
        if (member == null) {
            throw new ApiException(ErrorCode.REFRESH_INVALID);
        }
        return issueTokens(member);
    }

    /** 로그아웃: refresh token을 지워 즉시 재발급 불가로 만든다 (토큰이 없어도 성공으로 본다) */
    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenMapper.deleteByToken(SecureTokens.sha256(refreshToken));
        }
    }

    /**
     * 비밀번호 찾기(재설정) → 로그인 화면에 미리 채울 아이디
     * 이메일 인증(PASSWORD_RESET) 토큰으로 본인임을 확인한 뒤 바꾼다.
     * - 모든 기기의 로그인을 풀고(refresh token 전부 삭제), 새로 발급하지 않는다 (로그인 화면에서 다시 로그인)
     * - 이메일로 본인임을 확인했으므로 로그인 잠금(5번 실패)도 푼다
     */
    @Transactional
    public PasswordResetResponse resetPassword(PasswordResetRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        // 토큰 사용 처리 (이메일·목적이 맞고, 만료 전이고, 처음 쓰는 토큰이어야 한다)
        // 아래가 실패하면 같은 트랜잭션이라 토큰 사용도 되돌려진다
        emailVerificationService.consume(email, VerificationPurpose.PASSWORD_RESET, request.verificationToken());

        MemberRow member = memberMapper.findByEmail(email);
        if (member == null) {
            // 가입되지 않은 이메일에는 코드를 보내지 않으므로 여기까지 올 수 없다. 와도 인증 실패로 본다
            throw new ApiException(ErrorCode.EMAIL_NOT_VERIFIED,
                    Map.of("email", ErrorCode.EMAIL_NOT_VERIFIED.getDefaultMessage()));
        }

        memberMapper.updatePassword(member.getMemberId(), passwordEncoder.encode(request.newPassword()));
        refreshTokenMapper.deleteByMemberId(member.getMemberId());
        loginAttemptService.reset(member.getLoginId());
        return new PasswordResetResponse(member.getLoginId());
    }

    /**
     * 비밀번호 변경 → 지금 기기용 새 토큰
     * 다른 기기의 로그인을 풀기 위해 이 회원의 refresh token을 모두 지우고, 지금 기기에만 새로 발급한다.
     * (다른 기기의 access token은 만료될 때까지(최대 30분) 남는다)
     * 현재 비밀번호를 틀린 횟수는 로그인 실패와 같이 센다 (이 경로로 비밀번호를 대입해 보지 못하게)
     */
    @Transactional(noRollbackFor = ApiException.class)
    public AuthTokens changePassword(Long memberId, PasswordChangeRequest request) {
        MemberRow member = memberMapper.findById(memberId);
        if (member == null) {
            // 토큰은 유효하지만 회원이 사라진 경우
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
        LocalDateTime now = LocalDateTime.now();
        loginAttemptService.checkNotLocked(member.getLoginId(), now);

        if (!passwordEncoder.matches(request.currentPassword(), member.getPassword())) {
            loginAttemptService.recordFailure(member.getLoginId(), now);
            throw new ApiException(ErrorCode.CURRENT_PASSWORD_INVALID,
                    Map.of("currentPassword", ErrorCode.CURRENT_PASSWORD_INVALID.getDefaultMessage()));
        }
        if (passwordEncoder.matches(request.newPassword(), member.getPassword())) {
            String message = "현재 비밀번호와 다른 비밀번호를 입력해주세요.";
            throw new ApiException(ErrorCode.INVALID_INPUT, message, Map.of("newPassword", message));
        }

        loginAttemptService.reset(member.getLoginId());
        memberMapper.updatePassword(memberId, passwordEncoder.encode(request.newPassword()));
        refreshTokenMapper.deleteByMemberId(memberId);
        return issueTokens(member);
    }

    // access token(JWT)과 refresh token(무작위)을 함께 발급하고 refresh token 해시를 저장한다
    private AuthTokens issueTokens(MemberRow member) {
        LocalDateTime now = LocalDateTime.now();
        refreshTokenMapper.deleteExpiredByMemberId(member.getMemberId(), now); // 만료된 토큰 정리

        String refreshToken = SecureTokens.random(REFRESH_TOKEN_BYTES);
        refreshTokenMapper.insert(member.getMemberId(), SecureTokens.sha256(refreshToken),
                now.plus(jwtProvider.getRefreshTokenValidity()));

        String accessToken = jwtProvider.createAccessToken(member.getMemberId());
        return new AuthTokens(new AuthResponse(accessToken, MemberResponse.from(member)), refreshToken);
    }

    private static ApiException duplicated(ErrorCode code, String field) {
        return new ApiException(code, Map.of(field, code.getDefaultMessage()));
    }
}
