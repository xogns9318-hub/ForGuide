package com.example.forguide.member.security;

import com.example.forguide.member.common.ApiException;
import com.example.forguide.member.jwt.JwtProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * 요청마다 Authorization: Bearer {토큰}을 꺼내 검증하고 "누구의 요청인지"(회원 번호)를 기록한다.
 *
 * 이 필터는 요청을 막지 않는다. 토큰이 없거나 틀려도 다음으로 넘기고, 막을지는 SecurityConfig의 접근 규칙이 정한다.
 * (공개 주소에 만료된 토큰이 실려 와도 통과해야 하기 때문)
 *
 * 주의: @Component를 붙이지 않는다. 붙이면 일반 서블릿 필터로도 한 번 더 등록된다 → SecurityConfig에서 new로 만든다.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    /** 검증 실패 이유를 JwtAuthenticationEntryPoint에 전달할 때 쓰는 요청 속성 이름 */
    public static final String AUTH_ERROR = "authError";

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith(BEARER_PREFIX)) {
            try {
                Long memberId = jwtProvider.getMemberId(header.substring(BEARER_PREFIX.length()));

                // 인증 정보 = (누구인지, 비밀번호, 권한 목록). principal 자리에 회원 번호를 넣는다
                // 컨트롤러에서는 @AuthenticationPrincipal Long memberId 로 꺼낸다
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(memberId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (ApiException e) {
                // 필터의 예외는 컨트롤러 예외 처리기가 받지 못한다. 이유(TOKEN_EXPIRED 등)만 남기고 응답은 EntryPoint가 만든다
                request.setAttribute(AUTH_ERROR, e);
            }
        }

        chain.doFilter(request, response);
    }
}
