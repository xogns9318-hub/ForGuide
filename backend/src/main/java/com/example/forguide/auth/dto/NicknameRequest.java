package com.example.forguide.auth.dto;

/**
 * 닉네임 변경 요청. 규칙 검사는 MemberService에서 한다 (글자 수를 code point 기준으로 세기 위해).
 */
public record NicknameRequest(String nickname) {
}
