package com.example.forguide.consultation.institution.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.Refresh;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.json.JsonData;
import com.example.forguide.consultation.institution.service.InstitutionService;
import java.util.HashSet;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.ObjectMapper;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(
        prefix = "forguide.search.elasticsearch",
        name = {"enabled", "reindex-on-start"},
        havingValue = "true"
)
public class InstitutionSearchIndexConfig {

    private static final Logger log =
            LoggerFactory.getLogger(InstitutionSearchIndexConfig.class);

    private static final String SEARCH_ALIAS = "forguide-institutions";

    @Bean
    ApplicationRunner institutionSearchIndexLoader(
            ElasticsearchClient client,
            InstitutionService institutionService,
            ObjectMapper objectMapper
    ) {
        return args -> {
            try {
                // 기존 조회 기능으로 원본을 읽기만 하며 MySQL은 변경하지 않는다.
                var institutions = institutionService.findAll();
                if (institutions.isEmpty()) {
                    throw new IllegalStateException("복사할 기관이 없습니다.");
                }

                var ids = new HashSet<Long>();
                for (var institution : institutions) {
                    if (institution.id() < 1 || !ids.add(institution.id())) {
                        throw new IllegalStateException(
                                "기관 ID가 잘못되었거나 중복됩니다."
                        );
                    }
                }

                // 새 저장 공간에 먼저 복사해 실패 시 기존 검색 자료를 보호한다.
                String indexName = SEARCH_ALIAS + "-v1-"
                        + UUID.randomUUID().toString().replace("-", "");

                var definition =
                        new ClassPathResource("search/institutions-index.json");

                try (var input = definition.getInputStream()) {
                    var created = client.indices().create(request -> request
                            .index(indexName)
                            .withJson(input));

                    if (!created.acknowledged()) {
                        throw new IllegalStateException(
                                "검색 저장 공간 생성 확인에 실패했습니다."
                        );
                    }
                }

                var bulk = new BulkRequest.Builder().refresh(Refresh.True);

                for (var institution : institutions) {
                    var document = JsonData.fromJson(
                            objectMapper.writeValueAsString(institution)
                    );

                    bulk.operations(operation -> operation.index(index -> index
                            .index(indexName)
                            .id(Long.toString(institution.id()))
                            .document(document)));
                }

                var copied = client.bulk(bulk.build());

                if (copied.errors()) {
                    throw new IllegalStateException(
                            "일부 기관 자료를 복사하지 못했습니다."
                    );
                }

                long indexedCount = client.count(request -> request
                        .index(indexName)).count();

                if (indexedCount != institutions.size()) {
                    throw new IllegalStateException(
                            "원본과 복사된 기관 수가 다릅니다."
                    );
                }

                // 별칭은 검색에서 사용할 고정 이름이다.
                // 모든 복사가 끝난 뒤 새 자료에 연결한다.
                var aliases =
                        new co.elastic.clients.elasticsearch.indices.UpdateAliasesRequest.Builder();

                if (client.indices().existsAlias(request -> request
                        .name(SEARCH_ALIAS)).value()) {

                    var previous = client.indices().getAlias(request -> request
                            .name(SEARCH_ALIAS));

                    for (String previousIndex : previous.aliases().keySet()) {
                        aliases.actions(action -> action.remove(remove -> remove
                                .index(previousIndex)
                                .alias(SEARCH_ALIAS)
                                .mustExist(true)));
                    }
                }

                aliases.actions(action -> action.add(add -> add
                        .index(indexName)
                        .alias(SEARCH_ALIAS)));

                if (!client.indices().updateAliases(
                        aliases.build()).acknowledged()) {
                    throw new IllegalStateException(
                            "검색 자료 연결 확인에 실패했습니다."
                    );
                }

                log.info(
                        "기관 검색 자료 복사 완료: MySQL {}개 / Elasticsearch {}개 / 별칭 {}",
                        institutions.size(), indexedCount, SEARCH_ALIAS
                );
            } catch (Exception exception) {
                // 실패를 기록하되 기존 기관 조회와 다른 기능은 계속 사용할 수 있게 한다.
                log.error(
                        "기관 검색 자료 복사 실패. 기존 기관 조회는 유지합니다.",
                        exception
                );
            }
        };
    }
}