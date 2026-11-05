package com.example.forguide.consultation.institution.service;

import static org.junit.jupiter.api.Assertions.*;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import tools.jackson.databind.ObjectMapper;

// 로컬 Elasticsearch 검증을 명시적으로 켰을 때만 실행한다.
@EnabledIfEnvironmentVariable(
        named = "FORGUIDE_ELASTICSEARCH_TEST",
        matches = "true"
)
class InstitutionSearchReaderTest {

    private static final String ALIAS = "forguide-institutions";

    private static ElasticsearchClient client;
    private static InstitutionSearchReader reader;

    @BeforeAll
    static void setUp() {
        // Spring 서버와 MySQL을 시작하지 않고 로컬 검색 자료만 조회한다.
        client = ElasticsearchClient.of(configuration -> configuration
                .host("http://127.0.0.1:9200"));

        reader = new InstitutionSearchReader(
                client,
                new ObjectMapper(),
                ALIAS
        );
    }

    @AfterAll
    static void tearDown() throws Exception {
        if (client != null) {
            client.close();
        }
    }

    @Test
    void readsAllInstitutionsWithoutDuplicates() throws Exception {
        long expected = client.count(request -> request.index(ALIAS)).count();

        assertTrue(
                expected > 0,
                "먼저 기관 검색 자료를 복사해야 합니다."
        );

        var institutions = reader.findAll();

        assertEquals(expected, institutions.size());

        assertEquals(
                expected,
                institutions.stream()
                        .map(item -> item.id())
                        .distinct()
                        .count()
        );
    }

    @Test
    void searchesAnExistingInstitutionName() {
        var first = reader.findAll().get(0);

        var found = reader.search(Query.of(query -> query.term(term -> term
                .field("name.exact")
                .value(first.name()))));

        assertTrue(found.stream()
                .anyMatch(item -> item.id() == first.id()));
    }

    @Test
    void searchesServiceKeywordsWithinNestedDocuments() {
        var original = reader.findAll().stream()
                .filter(item -> item.services() != null)
                .filter(item -> item.services().stream()
                        .anyMatch(service ->
                                service.keywords() != null
                                        && !service.keywords().isEmpty()))
                .findFirst()
                .orElseThrow();

        String keyword = original.services().stream()
                .filter(service ->
                        service.keywords() != null
                                && !service.keywords().isEmpty())
                .findFirst()
                .orElseThrow()
                .keywords()
                .get(0);

        var found = reader.search(Query.of(query -> query.nested(nested -> nested
                .path("services")
                .query(serviceQuery -> serviceQuery.term(term -> term
                        .field("services.keywords")
                        .value(keyword))))));

        assertTrue(found.stream()
                .anyMatch(item -> item.id() == original.id()));

        assertTrue(found.stream()
                .allMatch(item -> item.services().stream()
                        .anyMatch(service ->
                                service.keywords() != null
                                        && service.keywords().contains(keyword))));
    }

    @Test
    void noMatchReturnsAnEmptyList() {
        var found = reader.search(Query.of(query -> query.term(term -> term
                .field("code")
                .value("__forguide_search_test_no_match__"))));

        assertTrue(found.isEmpty());
    }

    @Test
    void missingIndexIsAnErrorRatherThanAnEmptyResult() {
        var missing = new InstitutionSearchReader(
                client,
                new ObjectMapper(),
                "forguide-search-test-missing-alias"
        );

        var exception = assertThrows(
                ApiException.class,
                missing::findAll
        );

        assertEquals(
                ErrorCode.INSTITUTION_SEARCH_UNAVAILABLE,
                exception.getErrorCode()
        );
    }

    @Test
    void rejectsANullQuery() {
        var exception = assertThrows(
                ApiException.class,
                () -> reader.search(null)
        );

        assertEquals(
                ErrorCode.INVALID_INPUT,
                exception.getErrorCode()
        );
    }
}