package com.example.forguide.member.service;

import java.util.regex.Pattern;

/**
 * 닉네임 규칙 (회원가입·닉네임 변경 공통). 프론트 src/auth/utils/authValidation.js의 validateNickname과 같다.
 *
 * - 앞뒤 공백을 뺀 2~20자 (이모지 등도 한 글자로 센다), 다른 회원과 중복 허용
 * - 허용: 모든 언어의 글자·결합 기호·숫자·문장부호·기호·일반 공백
 * - 차단: 제어 문자·보이지 않는 문자 (같은 모양으로 다른 사람을 흉내 내는 것을 막기 위해)
 */
public final class NicknamePolicy {

    private static final Pattern ALLOWED = Pattern.compile("^[\\p{L}\\p{M}\\p{N}\\p{P}\\p{S} ]+$");

    private NicknamePolicy() {
    }

    /** 저장할 형태로 정리 (앞뒤 공백 제거, null은 빈 문자열) */
    public static String normalize(String nickname) {
        return nickname == null ? "" : nickname.trim();
    }

    /** 정리된 닉네임 검사 → 문제가 있으면 안내 문구, 없으면 null */
    public static String check(String normalized) {
        if (normalized.isEmpty()) return "닉네임을 입력해주세요.";
        int length = normalized.codePointCount(0, normalized.length());
        if (length < 2 || length > 20) return "닉네임은 2~20자로 입력해주세요.";
        if (!ALLOWED.matcher(normalized).matches()) return "닉네임에 쓸 수 없는 문자가 있습니다.";
        return null;
    }
}
