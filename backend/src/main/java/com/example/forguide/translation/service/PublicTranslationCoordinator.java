package com.example.forguide.translation.service;

import com.example.forguide.translation.cache.TranslationCacheResource;
import com.example.forguide.translation.mapper.TranslationJobMapper;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * DB 잠금으로 여러 서버에서도 같은 공개 번역의 Gemini 호출을 하나로 제한한다.
 */
@Component
@RequiredArgsConstructor
public class PublicTranslationCoordinator {

    private static final Duration LOCK_DURATION = Duration.ofMinutes(2);

    private final TranslationJobMapper translationJobMapper;

    public String newLockToken() {
        return UUID.randomUUID().toString();
    }

    public boolean tryAcquire(
            TranslationCacheResource resource,
            String targetLanguage,
            String lockToken
    ) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lockedUntil = now.plus(LOCK_DURATION);

        if (translationJobMapper.insertIfAbsent(
                resource.resourceType(),
                resource.resourceId(),
                resource.contentVersion(),
                targetLanguage,
                lockToken,
                lockedUntil
        ) == 1) {
            return true;
        }

        return translationJobMapper.takeExpiredJob(
                resource.resourceType(),
                resource.resourceId(),
                resource.contentVersion(),
                targetLanguage,
                lockToken,
                now,
                lockedUntil
        ) == 1;
    }

    public void release(
            TranslationCacheResource resource,
            String targetLanguage,
            String lockToken
    ) {
        translationJobMapper.deleteByLockToken(
                resource.resourceType(),
                resource.resourceId(),
                resource.contentVersion(),
                targetLanguage,
                lockToken
        );
    }
}
