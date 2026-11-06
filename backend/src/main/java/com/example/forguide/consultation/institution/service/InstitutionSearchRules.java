package com.example.forguide.consultation.institution.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.consultation.institution.dto.InstitutionDocument.ServiceDocument;
import com.example.forguide.consultation.institution.dto.InstitutionSearchCriteria;
import java.io.IOException;
import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@Component
public class InstitutionSearchRules {

    private static final Map<String, String> TOPIC_LABELS = Map.ofEntries(
            Map.entry("bank", "계좌·은행"),
            Map.entry("loan", "대출"),
            Map.entry("repayment", "채무·상환"),
            Map.entry("credit", "신용관리"),
            Map.entry("living", "생활비·지출"),
            Map.entry("wages", "급여·임금"),
            Map.entry("employment_contract", "근로계약·근무조건"),
            Map.entry("retirement", "퇴직·퇴직금"),
            Map.entry("employment", "취업·구직"),
            Map.entry("remittance", "송금·이체"),
            Map.entry("payment", "카드·결제"),
            Map.entry("housing", "주거비"),
            Map.entry("tax", "세금"),
            Map.entry("insurance", "보험·사회보장"),
            Map.entry("fraud", "금융사기·피해"),
            Map.entry("financial_support", "금융지원·복지"),
            Map.entry("financial_information", "금융정보·기초상담")
    );

    private static final Map<String, List<String>> ALIASES = Map.ofEntries(
            Map.entry("임금체불", List.of("임금 체불")),
            Map.entry("월급을못받음", List.of("임금 체불")),
            Map.entry("월급못받음", List.of("임금 체불")),
            Map.entry("퇴직금을못받음", List.of("퇴직금 미지급")),
            Map.entry("통장만들기", List.of("통장 개설")),
            Map.entry("돈보내기", List.of("송금")),
            Map.entry("대출이자", List.of("대출 금리", "이자")),
            Map.entry("카드값연체", List.of("카드 연체")),
            Map.entry("빚갚기", List.of("채무 상환")),
            Map.entry("신용등급", List.of("신용점수"))
    );

    private final List<Group> groups;

    public InstitutionSearchRules(ObjectMapper objectMapper) {
        var resource = new ClassPathResource("search/institution-topics.json");

        try (var input = resource.getInputStream()) {
            // 화면에서 복사한 분야·대표 키워드 기준을 그대로 읽는다.
            groups = List.copyOf(objectMapper.readValue(
                    input,
                    new TypeReference<List<Group>>() {}
            ));
        } catch (IOException | RuntimeException exception) {
            throw new IllegalStateException(
                    "기관 검색 분류 기준을 읽지 못했습니다.", exception
            );
        }
    }

    public Selection resolve(InstitutionSearchCriteria criteria) {
        if (criteria == null) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }

        var group = groups.stream()
                .filter(item -> item.code().equals(criteria.topic())
                        || item.name().equals(criteria.topic()))
                .findFirst()
                .orElse(null);

        // 기존 분야 코드나 이름으로 전달한 조건도 계속 처리한다.
        String legacyTopic = TOPIC_LABELS.entrySet().stream()
                .filter(entry -> entry.getKey().equals(criteria.topic())
                        || entry.getValue().equals(criteria.topic()))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("");

        if (!criteria.topic().isEmpty() && group == null && legacyTopic.isEmpty()) {
            throw invalid("topic", "상담 분야를 확인해주세요.");
        }

        if (group != null && !group.keywords().containsAll(criteria.keywords())) {
            throw invalid(
                    "keywords",
                    "선택한 상담 분야의 키워드를 선택해주세요."
            );
        }

        return new Selection(group, legacyTopic, criteria.keywords());
    }

    public boolean matches(Selection selection, ServiceDocument service) {
        // 분야와 선택 키워드는 서로 다른 업무를 섞지 않고 같은 업무에서 확인한다.
        return matchesTopic(selection, service)
                && (selection.keywords().isEmpty()
                || !matchedKeywords(selection, service).isEmpty());
    }

    public List<String> matchedKeywords(
            Selection selection,
            ServiceDocument service
    ) {
        if (!matchesTopic(selection, service)) {
            return List.of();
        }

        // 대표 키워드 하나에 여러 세부 표현이 맞아도 한 번만 센다.
        return selection.keywords().stream()
                .filter(keyword -> selection.group() != null
                        ? matchesRule(
                        selection.group().rules().get(keyword),
                        service
                )
                        : expandTerms(keyword).stream().anyMatch(term ->
                        actualKeywords(service).stream().anyMatch(actual ->
                                fold(actual).equals(fold(term)))))
                .toList();
    }

    private boolean matchesTopic(
            Selection selection,
            ServiceDocument service
    ) {
        if (service == null) {
            return false;
        }

        if (selection.group() != null) {
            return selection.group().rules().values().stream()
                    .anyMatch(rule -> matchesRule(rule, service));
        }

        return selection.legacyTopic().isEmpty()
                || selection.legacyTopic().equals(service.topic());
    }

    private boolean matchesRule(Rule rule, ServiceDocument service) {
        String topic = service.topic() == null ? "" : service.topic();

        return rule != null && rule.topics().contains(topic)
                && rule.terms().stream().anyMatch(term ->
                actualKeywords(service).stream().anyMatch(actual ->
                        fold(actual).equals(fold(term))));
    }

    private static List<String> actualKeywords(ServiceDocument service) {
        return service.keywords() == null ? List.of() : service.keywords();
    }

    public static String fold(String input) {
        // 띄어쓰기·문장부호만 정규화하며 표시할 원문은 변경하지 않는다.
        return Normalizer.normalize(
                        input == null ? "" : input,
                        Normalizer.Form.NFKC
                )
                .replaceAll("[^\\p{L}\\p{N}]", "")
                .toLowerCase(Locale.ROOT);
    }

    public static List<String> expandTerms(String input) {
        var terms = new LinkedHashSet<String>();

        if (input != null && !input.isBlank()) {
            terms.add(input.strip());
        }

        terms.addAll(ALIASES.getOrDefault(fold(input), List.of()));

        return List.copyOf(terms);
    }

    private static ApiException invalid(String field, String message) {
        return new ApiException(
                ErrorCode.INVALID_INPUT,
                Map.of(field, message)
        );
    }

    public record Group(
            String code,
            String name,
            List<String> keywords,
            Map<String, Rule> rules
    ) {
        public Group {
            keywords = List.copyOf(keywords);
            rules = Map.copyOf(rules);
        }
    }

    public record Rule(List<String> topics, List<String> terms) {
        public Rule {
            // 기존 DB 분야가 없는 행정·생활 업무의 null 조건도 보존한다.
            topics = topics.stream()
                    .map(topic -> topic == null ? "" : topic)
                    .toList();

            terms = List.copyOf(terms);
        }
    }

    public record Selection(
            Group group,
            String legacyTopic,
            List<String> keywords
    ) {
        public Selection {
            keywords = List.copyOf(keywords);
        }
    }
}