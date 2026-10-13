package com.example.forguide.member.security;

import com.example.forguide.member.jwt.JwtProperties;
import com.example.forguide.member.jwt.JwtProvider;
import jakarta.servlet.DispatcherType;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 토큰 기반 인증 설정. 서비스 전체 API에 적용된다.
 *
 * 기본 정책: 기본은 열어 두고, 로그인이 꼭 필요한 주소만 잠근다 (팀 결정 2026-10-13)
 * - 토큰이 실려 오면 어느 주소에서든 컨트롤러에서 @AuthenticationPrincipal Long memberId 로 회원 번호를 받을 수 있다
 * - 토큰이 없으면 memberId는 null이다. 로그인이 필요한 기능은 아래 "로그인 필요 주소" 구역에 해당 담당자가 한 줄 추가한다
 *   예) .requestMatchers(HttpMethod.POST, "/api/기능주소/**").authenticated()
 * 주의: 새 API를 만들 때 잠그는 것을 잊으면 로그인 없이 열린다
 */
@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    private final JwtProvider jwtProvider;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    public SecurityConfig(JwtProvider jwtProvider, JwtAuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtProvider = jwtProvider;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // ① 쓰지 않는 기본 기능 끄기
                .csrf(csrf -> csrf.disable())          // 토큰을 헤더로 보내므로 세션·쿠키 로그인용 방어는 끈다
                .formLogin(form -> form.disable())     // Security 기본 로그인 페이지
                .httpBasic(basic -> basic.disable())   // 브라우저 팝업 로그인
                .logout(logout -> logout.disable())    // 기본 /logout 대신 /api/v1/auth/logout 을 쓴다

                // ② 세션을 만들지 않는다 → 요청마다 토큰으로만 판단 (STATELESS)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ③ 주소별 접근 규칙 — 위에서부터 차례로 검사한다
                .authorizeHttpRequests(auth -> auth
                        // 오류 응답 전달(내부 이동)은 막지 않는다 (공개 주소의 오류가 401로 바뀌는 것 방지)
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()

                        // ── 로그인 필요 주소 ──
                        // 회원: 본인 닉네임·프로필 이미지 저장
                        .requestMatchers("/api/v1/members/me/**").authenticated()

                        // ── 그 밖의 주소는 로그인 없이 열림 ──
                        // (회원가입·로그인·재발급·로그아웃 /api/v1/auth/**, 프로필 이미지 조회 /api/v1/profile-images/** 포함)
                        .anyRequest().permitAll())

                // ④ 인증이 필요한데 없을 때 → 401 실패 응답 (ApiResponse 모양)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(authenticationEntryPoint))

                // ⑤ 토큰 필터를 Security 필터 체인에 끼워 넣는다
                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /** 비밀번호 BCrypt 암호화 (회원가입 저장·로그인 비교에 사용) */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
