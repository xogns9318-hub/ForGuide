package com.example.forguide.member.service;

import com.example.forguide.common.security.JwtProvider;
import com.example.forguide.member.dto.SignupRequest;
import com.example.forguide.member.mapper.MemberMapper;
import com.example.forguide.member.mapper.MemberRow;
import java.util.Locale;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 서버 시작 때 관리자 계정을 만든다 (환경변수 FORGUIDE_ADMIN_LOGIN_ID · FORGUIDE_ADMIN_PASSWORD · FORGUIDE_ADMIN_EMAIL)
 *
 * - 아이디·비밀번호가 비어 있으면 아무것도 하지 않는다 (관리자가 필요 없는 팀원 PC)
 * - 아이디·비밀번호는 회원가입과 같은 규칙이어야 한다. 맞지 않으면 만들지 않고 경고만 남긴다
 * - 같은 아이디가 이미 있으면 그대로 둔다. 일반 회원이면 관리자로 바꾸지 않는다
 *   (누군가 먼저 그 아이디로 가입해 관리자가 되는 것을 막기 위해서)
 * - 비밀번호는 로그에 남기지 않고, DB에는 BCrypt 해시만 저장한다
 */
@Component
@ConditionalOnProperty(
        name = "forguide.admin.initializer.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class AdminAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private static final Pattern LOGIN_ID_PATTERN = Pattern.compile(SignupRequest.LOGIN_ID_PATTERN);
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(SignupRequest.PASSWORD_PATTERN);
    private static final String ADMIN_NAME = "관리자";

    private final MemberMapper memberMapper;
    private final PasswordEncoder passwordEncoder;
    private final String loginId;
    private final String password;
    private final String email;

    public AdminAccountInitializer(MemberMapper memberMapper, PasswordEncoder passwordEncoder,
                                   @Value("${forguide.admin.login-id:}") String loginId,
                                   @Value("${forguide.admin.password:}") String password,
                                   @Value("${forguide.admin.email:}") String email) {
        this.memberMapper = memberMapper;
        this.passwordEncoder = passwordEncoder;
        this.loginId = loginId == null ? "" : loginId.trim();
        this.password = password == null ? "" : password;
        this.email = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (loginId.isEmpty() || password.isEmpty()) {
            log.info("관리자 계정 환경변수(FORGUIDE_ADMIN_LOGIN_ID·PASSWORD)가 없어 관리자 계정을 만들지 않습니다.");
            return;
        }
        if (!LOGIN_ID_PATTERN.matcher(loginId).matches() || !PASSWORD_PATTERN.matcher(password).matches()) {
            log.warn("관리자 아이디·비밀번호가 회원가입 규칙에 맞지 않아 관리자 계정을 만들지 않습니다.");
            return;
        }

        MemberRow existing = memberMapper.findByLoginId(loginId);
        if (existing != null) {
            if (!JwtProvider.ROLE_ADMIN.equals(existing.getRole())) {
                log.warn("관리자 아이디({})로 가입한 일반 회원이 있어 관리자로 바꾸지 않습니다. 다른 아이디를 쓰세요.", loginId);
            }
            return;
        }

        // 이메일은 필수·중복 불가. 정하지 않았으면 쓰이지 않는 내부 주소를 쓴다
        String adminEmail = email.isEmpty() ? loginId + "@admin.forguide.local" : email;
        if (memberMapper.existsByEmail(adminEmail)) {
            log.warn("관리자 이메일이 이미 다른 회원에게 쓰이고 있어 관리자 계정을 만들지 않습니다.");
            return;
        }

        MemberRow row = new MemberRow();
        row.setLoginId(loginId);
        row.setPassword(passwordEncoder.encode(password));
        row.setRole(JwtProvider.ROLE_ADMIN);
        row.setName(ADMIN_NAME);
        row.setGivenName(ADMIN_NAME);
        row.setNickname(ADMIN_NAME);
        row.setEmail(adminEmail);
        memberMapper.insert(row);
        log.info("관리자 계정({})을 만들었습니다.", loginId);
    }
}
