package com.example.forguide.consultation.institution.service;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchRequest;
import co.elastic.clients.elasticsearch.core.search.Hit;
import co.elastic.clients.elasticsearch.core.search.TotalHitsRelation;
import co.elastic.clients.json.JsonData;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.consultation.institution.dto.InstitutionDocument;
import com.example.forguide.consultation.institution.dto.InstitutionSearchHit;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
@ConditionalOnProperty(
        prefix = "forguide.search.elasticsearch",
        name = "enabled",
        havingValue = "true"
)
public class InstitutionSearchReader {

    private static final Logger log =
            LoggerFactory.getLogger(InstitutionSearchReader.class);

    private static final int BATCH_SIZE = 10;

    private final ElasticsearchClient client;
    private final ObjectMapper objectMapper;
    private final String indexAlias;

    public InstitutionSearchReader(
            ElasticsearchClient client,
            ObjectMapper objectMapper,
            @Value("${forguide.search.elasticsearch.index-alias:forguide-institutions}")
            String indexAlias
    ) {
        this.client = client;
        this.objectMapper = objectMapper;
        this.indexAlias = indexAlias;
    }

    public List<InstitutionDocument> findAll() {
        return search(Query.of(query -> query.matchAll(match -> match)));
    }

    public List<InstitutionDocument> search(Query query) {
        // 기존 기관 목록 조회와 테스트의 반환 구조는 유지한다.
        return searchWithMatches(query).stream()
                .map(InstitutionSearchHit::institution)
                .toList();
    }

    public List<InstitutionSearchHit> searchWithMatches(Query query) {
        if (query == null) {
            throw new ApiException(ErrorCode.INVALID_INPUT);
        }

        try {
            // 조회 도중 별칭이 바뀌어도 같은 복사본에서 끝까지 읽는다.
            // 현재 복사 기능은 기존 인덱스를 수정하지 않고 새 인덱스를 만든다.
            var indices = client.indices()
                    .getAlias(request -> request.name(indexAlias))
                    .aliases()
                    .keySet();

            if (indices.size() != 1) {
                throw new IllegalStateException(
                        "검색 별칭은 인덱스 하나에 연결되어야 합니다."
                );
            }

            String indexName = indices.iterator().next();

            var institutions = new ArrayList<InstitutionSearchHit>();
            List<FieldValue> after = List.of();

            while (true) {
                var request = new SearchRequest.Builder()
                        .index(indexName)
                        .query(query)
                        .size(BATCH_SIZE)
                        .allowPartialSearchResults(false)
                        .sort(sort -> sort.field(field -> field
                                .field("id")
                                .order(SortOrder.Asc)));

                if (!after.isEmpty()) {
                    request.searchAfter(after);
                }

                var response = client.search(request.build(), JsonData.class);

                if (response.timedOut()
                        || response.shards().failed().intValue() > 0) {
                    throw new IllegalStateException(
                            "검색 결과를 완전히 읽지 못했습니다."
                    );
                }

                var hits = response.hits().hits();

                for (var hit : hits) {
                    institutions.add(readHit(hit));
                }

                if (hits.size() < BATCH_SIZE) {
                    break;
                }

                // 기본 10개 제한으로 기관이 누락되지 않도록 다음 묶음을 읽는다.
                var next = hits.get(hits.size() - 1).sort();

                if (next.isEmpty() || next.equals(after)) {
                    throw new IllegalStateException(
                            "다음 검색 결과 위치를 확인하지 못했습니다."
                    );
                }

                after = next;
            }

            return List.copyOf(institutions);
        } catch (IOException | RuntimeException exception) {
            // 연결 실패를 정상적인 검색 결과 0건으로 바꾸지 않는다.
            log.warn(
                    "기관 검색 자료 조회 실패: {}",
                    exception.getClass().getSimpleName()
            );

            throw new ApiException(
                    ErrorCode.INSTITUTION_SEARCH_UNAVAILABLE
            );
        }
    }

    InstitutionSearchHit readHit(Hit<JsonData> hit) throws IOException {
        if (hit.source() == null) {
            throw new IllegalStateException(
                    "검색 결과의 기관 원문이 없습니다."
            );
        }

        var institution = objectMapper.readValue(
                hit.source().toJson().toString(),
                InstitutionDocument.class
        );

        boolean institutionMatched = hit.matchedQueries().containsKey(
                InstitutionSearchQueryFactory.INSTITUTION_MATCH
        );

        var serviceIds = new HashSet<Long>();

        var inner = hit.innerHits().get(
                InstitutionSearchQueryFactory.SERVICE_MATCH
        );

        if (inner != null) {
            var total = inner.hits().total();
            var matches = inner.hits().hits();

            // 업무 조회 한도를 넘거나 일부만 반환되면 정상 결과로 사용하지 않는다.
            if (total == null
                    || total.relation() != TotalHitsRelation.Eq
                    || total.value() != matches.size()) {
                throw new IllegalStateException(
                        "검색에 일치한 상담 업무를 완전히 읽지 못했습니다."
                );
            }

            var originalIds = new HashSet<Long>();

            if (institution.services() != null) {
                institution.services().forEach(service ->
                        originalIds.add(service.id()));
            }

            for (var match : matches) {
                if (match.source() == null
                        || match.nested() == null
                        || !"services".equals(match.nested().field())) {
                    throw new IllegalStateException(
                            "일치한 상담 업무 원문이 없습니다."
                    );
                }

                var service = objectMapper.readValue(
                        match.source().toJson().toString(),
                        InstitutionDocument.ServiceDocument.class
                );

                // 검색 결과에 다른 기관의 업무나 중복 업무가 섞이지 않았는지 확인한다.
                if (service.id() < 1
                        || !originalIds.contains(service.id())
                        || !serviceIds.add(service.id())) {
                    throw new IllegalStateException(
                            "일치한 상담 업무 ID가 잘못되었습니다."
                    );
                }
            }
        }

        return new InstitutionSearchHit(
                institution,
                institutionMatched,
                serviceIds
        );
    }
}