package com.example.forguide.consultation.institution.service;

import com.example.forguide.consultation.institution.dto.InstitutionDocument;
import com.example.forguide.consultation.institution.dto.InstitutionDocument.ServiceDocument;
import com.example.forguide.consultation.institution.dto.InstitutionSearchCriteria;
import com.example.forguide.consultation.institution.dto.InstitutionSearchHit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class InstitutionSearchResultAssembler {

    private static final Comparator<Candidate> CANDIDATE_ORDER = Comparator
            .comparingInt((Candidate item) -> roleRank(item.service().role()))
            .thenComparingInt(item -> -item.keywords().size())
            .thenComparingInt(item -> item.channel().unknown().size())
            .thenComparingLong(item -> item.service().id());

    private static final Comparator<Item> ITEM_ORDER = Comparator
            .comparingInt((Item item) -> roleRank(item.match().role()))
            .thenComparingInt(item -> -item.match().keywords().size())
            .thenComparingInt(item -> item.match().unknown().size())
            .thenComparingLong(item -> item.institution().id());

    private final InstitutionSearchRules rules;
    private final InstitutionSearchChannelMatcher channelMatcher;

    public InstitutionSearchResultAssembler(
            InstitutionSearchRules rules,
            InstitutionSearchChannelMatcher channelMatcher
    ) {
        this.rules = rules;
        this.channelMatcher = channelMatcher;
    }

    public List<Item> assemble(
            List<InstitutionSearchHit> hits,
            InstitutionSearchCriteria criteria
    ) {
        var selection = rules.resolve(criteria);

        if (hits == null) {
            throw new IllegalStateException("기관 검색 자료가 없습니다.");
        }

        var items = new ArrayList<Item>();
        var institutionIds = new HashSet<Long>();

        for (var hit : hits) {
            if (hit == null || hit.institution() == null
                    || !institutionIds.add(hit.institution().id())) {
                throw new IllegalStateException(
                        "기관 검색 자료가 잘못되었거나 중복되었습니다."
                );
            }

            var institution = hit.institution();
            var candidates = new ArrayList<Candidate>();

            var services = institution.services() == null
                    ? List.<ServiceDocument>of()
                    : institution.services();

            for (var service : services) {
                if (service == null || !rules.matches(selection, service)) {
                    continue;
                }

                // 검색어가 특정 업무에만 맞았다면 다른 업무의 조건과 섞지 않는다.
                // 기관명 등에 맞거나 검색어가 없으면 해당 기관의 업무들을 확인한다.
                if (!criteria.query().isEmpty()
                        && !hit.institutionMatched()
                        && !hit.serviceIds().contains(service.id())) {
                    continue;
                }

                var channel = channelMatcher.bestMatch(service, criteria);

                if (channel != null) {
                    candidates.add(new Candidate(
                            service,
                            rules.matchedKeywords(selection, service),
                            channel
                    ));
                }
            }

            if (candidates.isEmpty()) {
                continue;
            }

            // 직접 상담, 키워드 일치 개수, 미확인 조건 수, 업무 ID 순으로 대표 업무를 고른다.
            candidates.sort(CANDIDATE_ORDER);

            var best = candidates.get(0);
            var matched = new LinkedHashSet<String>();

            candidates.forEach(candidate ->
                    matched.addAll(candidate.keywords()));

            int selectedCount = selection.keywords().size();

            // 같은 키워드가 여러 업무에 맞아도 기관 전체에서는 한 번만 센다.
            // 이 비율은 선택 키워드의 일치율이며 지원 자격이나 승인 확률이 아니다.
            Integer percent = selectedCount == 0
                    ? null
                    : (int) Math.round(matched.size() * 100.0 / selectedCount);

            items.add(new Item(
                    institution,
                    best.service(),
                    new MatchInfo(
                            best.service().role(),
                            List.copyOf(matched),
                            selectedCount,
                            percent,
                            best.channel().unknown()
                    )
            ));
        }

        // 기관 카드는 기관당 한 번만 만들고 같은 조건에는 같은 순서를 반환한다.
        items.sort(ITEM_ORDER);

        return List.copyOf(items);
    }

    private static int roleRank(String role) {
        if ("direct".equals(role)) {
            return 0;
        }

        return "related".equals(role) ? 1 : 2;
    }

    private record Candidate(
            ServiceDocument service,
            List<String> keywords,
            InstitutionSearchChannelMatcher.Match channel
    ) {}

    public record Item(
            InstitutionDocument institution,
            ServiceDocument preview,
            MatchInfo match
    ) {}

    public record MatchInfo(
            String role,
            List<String> keywords,
            int selectedCount,
            Integer percent,
            List<String> unknown
    ) {
        public MatchInfo {
            keywords = List.copyOf(keywords);
            unknown = List.copyOf(unknown);
        }
    }
}