package com.example.forguide.consultation.institution.dto;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import java.util.List;
import java.util.Map;

public record InstitutionSearchCriteria(
        String query,
        String topic,
        List<String> keywords,
        String province,
        String district,
        String language,
        String method
) {
    public InstitutionSearchCriteria {
        // 화면의 전체 선택과 누락된 값은 조건 없음으로 통일한다.
        query = clean(query);
        topic = clean(topic);
        province = clean(province);
        district = clean(district);
        language = clean(language);
        method = clean(method);

        // 같은 키워드를 반복해서 보내도 일치 개수를 부풀리지 않는다.
        keywords = keywords == null
                ? List.of()
                : keywords.stream()
                .map(InstitutionSearchCriteria::clean)
                .filter(keyword -> !keyword.isEmpty())
                .distinct()
                .toList();

        // 기존 화면의 검색어 100자·키워드 50개 제한을 서버에서도 확인한다.
        if (query.length() > 100) {
            throw invalid("query", "검색어는 100자 이하로 입력해주세요.");
        }

        if (!query.isEmpty()
                && query.codePoints().noneMatch(Character::isLetterOrDigit)) {
            throw invalid("query", "검색어에 글자나 숫자를 포함해주세요.");
        }

        if (keywords.size() > 50) {
            throw invalid("keywords", "상담 키워드는 50개 이하로 선택해주세요.");
        }

        // 한글 표시값과 내부 코드를 같은 상담 방식으로 처리한다.
        method = switch (method) {
            case "", "모름" -> "";
            case "전화", "phone" -> "phone";
            case "방문", "visit" -> "visit";
            case "예약", "reservation" -> "reservation";
            default -> throw invalid("method", "상담 방식을 확인해주세요.");
        };
    }

    private static String clean(String input) {
        if (input == null) {
            return "";
        }

        String result = input.strip();
        return "전체".equals(result) ? "" : result;
    }

    private static ApiException invalid(String field, String message) {
        return new ApiException(
                ErrorCode.INVALID_INPUT,
                Map.of(field, message)
        );
    }
}