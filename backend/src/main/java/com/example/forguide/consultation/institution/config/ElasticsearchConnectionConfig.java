package com.example.forguide.consultation.institution.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(
        prefix = "forguide.search.elasticsearch",
        name = "enabled",
        havingValue = "true"
)
public class ElasticsearchConnectionConfig {

    private static final Logger log =
            LoggerFactory.getLogger(ElasticsearchConnectionConfig.class);

    @Bean
    ApplicationRunner institutionSearchConnectionCheck(ElasticsearchClient client) {
        return args -> {
            // 연결 확인에서는 검색 자료나 MySQL 데이터를 변경하지 않는다.
            try {
                var information = client.info();
                var analysis = client.indices().analyze(request -> request
                        .analyzer("nori")
                        .text("임금 체불 상담"));

                log.info("Elasticsearch 연결 확인 성공: {}",
                        information.version().number());

                log.info("Nori 한국어 분석 확인: {}", analysis.tokens().stream()
                        .map(token -> token.token())
                        .toList());
            } catch (Exception exception) {
                // 검색 서버가 꺼져 있어도 기존 기관 조회와 다른 기능은 유지한다.
                log.warn("Elasticsearch 연결 확인 실패. 기존 기관 조회는 유지합니다. 원인={}",
                        exception.getClass().getSimpleName());
            }
        };
    }
}