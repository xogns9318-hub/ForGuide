package com.example.forguide.consultation.institution.service;

import co.elastic.clients.elasticsearch._types.query_dsl.ChildScoreMode;
import co.elastic.clients.elasticsearch._types.query_dsl.Operator;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.ZeroTermsQuery;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.consultation.institution.dto.InstitutionSearchCriteria;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class InstitutionSearchQueryFactory {

    public static final String INSTITUTION_MATCH = "institution_text";
    public static final String SERVICE_MATCH = "matching_services";
    public static final int SERVICE_HITS_LIMIT = 100;

    public Query build(InstitutionSearchCriteria criteria) {
        if (criteria == null) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }

        if (criteria.query().isEmpty()) {
            return Query.of(query -> query.matchAll(match -> match));
        }

        var institutionQueries = new ArrayList<Query>();
        var serviceQueries = new ArrayList<Query>();

        for (String expanded : InstitutionSearchRules.expandTerms(criteria.query())) {
            String term = Normalizer.normalize(
                    expanded,
                    Normalizer.Form.NFKC
            );

            // 기관명·별칭·대표 키워드는 기존에 설치한 한국어 분석기로 검색한다.
            institutionQueries.add(textQuery(
                    List.of("name", "aliases", "featuredKeywords"),
                    term
            ));

            institutionQueries.add(containsQuery("name.exact", term));
            institutionQueries.add(containsQuery("phone", term));

            // 상담 내용은 각 업무 안에서 검색해 일치한 업무를 구분한다.
            serviceQueries.add(textQuery(
                    List.of(
                            "services.name",
                            "services.summary",
                            "services.description"
                    ),
                    term
            ));

            serviceQueries.add(containsQuery("services.keywords", term));
        }

        Query institutionQuery = Query.of(query -> query.bool(bool -> bool
                .should(institutionQueries)
                .minimumShouldMatch("1")
                .queryName(INSTITUTION_MATCH)));

        Query serviceQuery = Query.of(query -> query.nested(nested -> nested
                .path("services")
                .scoreMode(ChildScoreMode.None)
                .query(inner -> inner.bool(bool -> bool
                        .should(serviceQueries)
                        .minimumShouldMatch("1")))
                // 다음 조회 단계에서 이 정보로 검색어가 맞은 업무를 확인한다.
                .innerHits(hits -> hits
                        .name(SERVICE_MATCH)
                        .size(SERVICE_HITS_LIMIT))));

        return Query.of(query -> query.bool(bool -> bool
                .should(institutionQuery, serviceQuery)
                .minimumShouldMatch("1")));
    }

    private Query textQuery(List<String> fields, String term) {
        return Query.of(query -> query.multiMatch(match -> match
                .fields(fields)
                .query(term)
                .analyzer("institution_korean")
                .operator(Operator.And)
                // 분석 후 단어가 남지 않아도 전체 기관 검색으로 바꾸지 않는다.
                .zeroTermsQuery(ZeroTermsQuery.None)));
    }

    private Query containsQuery(String field, String term) {
        // 사용자가 입력한 별표와 물음표를 검색 명령으로 해석하지 않는다.
        String escaped = term
                .replace("\\", "\\\\")
                .replace("*", "\\*")
                .replace("?", "\\?");

        return Query.of(query -> query.wildcard(wildcard -> wildcard
                .field(field)
                .value("*" + escaped + "*")
                .caseInsensitive(true)));
    }
}