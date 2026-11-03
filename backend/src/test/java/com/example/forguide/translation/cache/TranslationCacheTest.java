package com.example.forguide.translation.cache;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import com.example.forguide.common.transaction.AfterCommitExecutor;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class TranslationCacheTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private AfterCommitExecutor afterCommitExecutor;

    @Test
    void Redis_조회_장애는_빈_캐시로_처리한다() {
        TranslationCache cache = new TranslationCache(
                redisTemplate,
                afterCommitExecutor
        );

        when(redisTemplate.opsForValue()).thenThrow(
                new DataAccessResourceFailureException("Redis unavailable")
        );

        Optional<String> result = cache.get("translation:test");

        assertTrue(result.isEmpty());
    }

    @Test
    void Redis_저장_장애는_번역_요청을_실패시키지_않는다() {
        TranslationCache cache = new TranslationCache(
                redisTemplate,
                afterCommitExecutor
        );

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        doThrow(new DataAccessResourceFailureException("Redis unavailable"))
                .when(valueOperations)
                .set(anyString(), anyString(), any());

        assertDoesNotThrow(() -> cache.put("translation:test", "Hello"));
    }
}
