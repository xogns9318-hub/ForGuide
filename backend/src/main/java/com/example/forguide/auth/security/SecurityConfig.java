package com.example.forguide.auth.security;

import com.example.forguide.auth.image.ProfileImageStorage;
import com.example.forguide.auth.jwt.JwtProperties;
import com.example.forguide.auth.jwt.JwtProvider;
import jakarta.servlet.DispatcherType;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 토큰 기반 인증 설정. 서비스 전체 API에 적용된다.
 *
 * 기본 정책: 공개할 주소만 열고 나머지는 로그인 필요 (새 API를 깜빡하고 열어 두는 사고를 막기 위해)
 * 다른 기능에서 로그인 없이 써야 하는 주소가 있으면, 아래 "공개 주소" 구역에 해당 담당자가 한 줄 추가한다.
 *   예) .requestMatchers(HttpMethod.GET, "/api/v1/기능주소/**").permitAll()
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

                        // ── 공개 주소 ──
                        // 인증: 회원가입·아이디 중복 확인·로그인·재발급·로그아웃
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // 프로필 이미지 조회 (다른 사람의 프로필 이미지도 볼 수 있어야 하므로 조회만 공개)
                        .requestMatchers(HttpMethod.GET, ProfileImageStorage.URL_PREFIX + "**").permitAll()

                        // ── 그 밖의 모든 주소는 로그인 필요 ──
                        .anyRequest().authenticated())

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
