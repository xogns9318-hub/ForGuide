package com.example.forguide.translation.cache;

import com.example.forguide.common.transaction.AfterCommitExecutor;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class TranslationCache {

    private static final Logger log = LoggerFactory.getLogger(TranslationCache.class);

    // 캐시 규칙이 바뀌었으므로 기존 v1 캐시와 분리한다.
    private static final String KEY_PREFIX = "translation:v2:";

    // 번역 결과는 7일 동안만 재사용한다.
    private static final Duration TTL = Duration.ofDays(7);

    // 공개 콘텐츠 번역에 지원하는 대상 언어.
    private static final List<String> SUPPORTED_TARGET_LANGUAGES = List.of(
            "ko",
            "en",
            "ja",
            "zh",
            "vi",
            "th"
    );

    private final StringRedisTemplate redisTemplate;
    private final AfterCommitExecutor afterCommitExecutor;

    /*
     * 예:
     * translation:v2:community-post:7:v3:ko:en
     *
     * 원문 자체나 원문 해시는 Redis 키에 넣지 않는다.
     * contentVersion이 바뀌면 새 키를 사용하므로 수정 전 번역은 재사용되지 않는다.
     */
    public String createKey(
            TranslationCacheResource resource,
            String sourceLanguage,
            String targetLanguage
    ) {
        return KEY_PREFIX
                + resource.resourceType()
                + ":"
                + resource.resourceId()
                + ":v"
                + resource.contentVersion()
                + ":"
                + sourceLanguage
                + ":"
                + targetLanguage;
    }

    public TranslationCache(
            StringRedisTemplate redisTemplate,
            AfterCommitExecutor afterCommitExecutor
    ) {
        this.redisTemplate = redisTemplate;
        this.afterCommitExecutor = afterCommitExecutor;
    }

    // 캐시에 있으면 번역문을 반환하고, 없으면 Optional.empty()를 반환한다.
    public Optional<String> get(String key) {
        try {
            return Optional.ofNullable(
                    redisTemplate.opsForValue().get(key)
            );
        } catch (DataAccessException exception) {
            // Redis는 보조 캐시이므로 장애가 나도 DB 번역문 조회를 계속한다.
            log.warn("Redis 번역 캐시 조회를 건너뜁니다. key={}, reason={}",
                    key, exception.getMessage());
            return Optional.empty();
        }
    }

    // 번역 결과를 저장하고 7일 뒤 자동 만료되도록 한다.
    public void put(String key, String translatedText) {
        try {
            redisTemplate.opsForValue().set(
                    key,
                    translatedText,
                    TTL
            );
        } catch (DataAccessException exception) {
            // DB 저장과 화면 응답은 유지하고, 다음 요청에서 다시 캐시를 채운다.
            log.warn("Redis 번역 캐시 저장을 건너뜁니다. key={}, reason={}",
                    key, exception.getMessage());
        }
    }

    /*
     * 수정·삭제된 공개 콘텐츠의 이전 버전에 연결된 번역을 모두 제거한다.
     * Redis의 KEYS 검색 대신, 우리가 만든 여섯 개 키만 정확히 삭제한다.
     */
    public void evict(
            TranslationCacheResource resource,
            String sourceLanguage
    ) {
        try {
            for (String targetLanguage : SUPPORTED_TARGET_LANGUAGES) {
                redisTemplate.delete(
                        createKey(resource, sourceLanguage, targetLanguage)
                );
            }
        } catch (DataAccessException exception) {
            // DB 번역문은 이미 삭제됐고, 남은 캐시는 TTL 뒤 자연 만료된다.
            log.warn("Redis 번역 캐시 삭제를 건너뜁니다. resourceType={}, resourceId={}, reason={}",
                    resource.resourceType(), resource.resourceId(), exception.getMessage());
        }
    }

    /*
     * DB 변경이 실제로 커밋된 뒤에만 캐시를 제거한다.
     * Mockito 단위 테스트처럼 트랜잭션이 없는 환경에서는 즉시 제거한다.
     */
    public void evictAfterCommit(
            TranslationCacheResource resource,
            String sourceLanguage
    ) {
        afterCommitExecutor.runAfterCommitOrNow(
                () -> evict(resource, sourceLanguage)
        );
    }
}
