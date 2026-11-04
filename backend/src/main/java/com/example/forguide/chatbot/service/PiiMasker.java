package com.example.forguide.chatbot.service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * 질문을 OpenAI로 보내기 전에 개인정보로 보이는 번호를 가린다.
 * 숫자·영문자는 *로 바꾸고 하이픈·공백은 남겨, 모델이 "가려진 번호"라는 것만 알 수 있게 한다.
 * 예) 900101-1234567 → ******-*******, 010-1234-5678 → ***-****-****
 *
 * 검사 순서가 중요하다: 긴 번호(주민번호)를 먼저 가려야 짧은 규칙(전화·계좌)이 그 일부만 가리지 않는다.
 */
@Component
public class PiiMasker {

    private static final List<Pattern> PATTERNS = List.of(
            // 주민등록번호(뒷자리 1~4)·외국인등록번호(뒷자리 5~8): 앞 6자리 + 뒤 7자리
            Pattern.compile("(?<!\\d)\\d{6}[\\s-]?[1-8]\\d{6}(?!\\d)"),
            // 휴대전화: 010-1234-5678, 01012345678
            Pattern.compile("(?<!\\d)01[016789][\\s-]?\\d{3,4}[\\s-]?\\d{4}(?!\\d)"),
            // 일반 전화: 02-123-4567, 031-1234-5678 (하이픈이 있을 때만)
            Pattern.compile("(?<!\\d)0\\d{1,2}-\\d{3,4}-\\d{4}(?!\\d)"),
            // 계좌번호(하이픈 형식): 숫자 묶음 3~4개, 숫자 합계 10자리 이상 (예: 123-456789-01-234)
            // 10자리 조건이 없으면 날짜(2026-11-04)까지 가려진다
            Pattern.compile("(?<!\\d)(?=(?:\\d-?){10,})\\d{2,6}-\\d{2,6}-\\d{2,8}(?:-\\d{1,3})?(?!\\d)"),
            // 계좌번호(숫자만): 10~16자리 연속 숫자
            Pattern.compile("(?<![\\d,.])\\d{10,16}(?![\\d,.])"),
            // 여권번호: 영문 1~2자 + 숫자 7~8자리 (예: M12345678)
            Pattern.compile("(?<![A-Za-z0-9])[A-Za-z]{1,2}\\d{7,8}(?![A-Za-z0-9])")
    );

    public String mask(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        String masked = text;

        for (Pattern pattern : PATTERNS) {
            masked = maskMatches(pattern, masked);
        }

        return masked;
    }

    private String maskMatches(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        StringBuilder result = new StringBuilder();

        while (matcher.find()) {
            String hidden = matcher.group().replaceAll("[A-Za-z0-9]", "*");
            matcher.appendReplacement(result, Matcher.quoteReplacement(hidden));
        }

        matcher.appendTail(result);
        return result.toString();
    }
}
