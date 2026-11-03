package com.example.forguide.translation.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.translation.cache.TranslationCache;
import com.example.forguide.translation.cache.TranslationCacheResource;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import org.springframework.stereotype.Service;
import com.example.forguide.translation.mapper.TranslationMapper;
import java.util.Optional;

@Service
public class TranslationService {
    private static final int WAIT_ATTEMPTS = 20;
    private static final long WAIT_INTERVAL_MILLIS = 150L;

    private final GeminiTranslationClient geminiTranslationClient;
    private final TranslationCache translationCache;
    private final TranslationMapper translationMapper;
    private final PublicTranslationCoordinator publicTranslationCoordinator;

    public TranslationService(
            GeminiTranslationClient geminiTranslationClient,
            TranslationCache translationCache,
            TranslationMapper translationMapper,
            PublicTranslationCoordinator publicTranslationCoordinator
    ) {
        this.geminiTranslationClient = geminiTranslationClient;
        this.translationCache = translationCache;
        this.translationMapper = translationMapper;
        this.publicTranslationCoordinator = publicTranslationCoordinator;
    }

    /*
     * 게시글·댓글처럼 공개된 콘텐츠 번역.
     * 콘텐츠 종류·번호·버전을 Redis 캐시 키에 사용한다.
     */
    public TranslationResponse translatePublicText(
            TranslationRequest request,
            TranslationCacheResource cacheResource
    ) {
        return translate(request, cacheResource);
    }

    /*
     * 이력서처럼 개인정보가 포함될 수 있는 텍스트 번역.
     * Redis에 원문이나 번역문을 저장하지 않는다.
     */
    public TranslationResponse translatePrivateText(
            TranslationRequest request
    ) {
        return translate(request, null);
    }

    private TranslationResponse translate(
            TranslationRequest request,
            TranslationCacheResource cacheResource
    ) {
        // 원문 언어와 대상 언어가 같다면 외부 API를 호출하지 않는다.
        if (request.getSourceLanguage()
                .equals(request.getTargetLanguage())) {
            return new TranslationResponse(
                    request.getSourceText(),
                    false
            );
        }

        if (cacheResource != null) {
            return translateAndStorePublicText(request, cacheResource);
        }

        // 이력서처럼 개인정보가 포함된 번역은 Redis와 공개 번역 DB에 저장하지 않는다.
        String translatedText = geminiTranslationClient.translate(
                request.getSourceLanguage(),
                request.getTargetLanguage(),
                request.getSourceText()
        );

        return new TranslationResponse(translatedText, false);
    }

    private TranslationResponse translateAndStorePublicText(
            TranslationRequest request,
            TranslationCacheResource resource
    ) {
        String targetLanguage = request.getTargetLanguage();
        String cacheKey = translationCache.createKey(
                resource,
                request.getSourceLanguage(),
                targetLanguage
        );

        // Redis 장애 시에도 get은 빈 값으로 처리돼 아래 DB 조회로 이어진다.
        Optional<String> cachedText = translationCache.get(cacheKey);

        if (cachedText.isPresent()) {
            return new TranslationResponse(cachedText.get(), true);
        }

        String storedTranslation = findStoredPublicTranslation(resource, targetLanguage);

        if (storedTranslation != null) {
            translationCache.put(cacheKey, storedTranslation);
            return new TranslationResponse(storedTranslation, true);
        }

        String lockToken = publicTranslationCoordinator.newLockToken();

        if (!publicTranslationCoordinator.tryAcquire(resource, targetLanguage, lockToken)) {
            return waitForPublicTranslation(resource, targetLanguage, cacheKey);
        }

        try {
            // 잠금 확보 직전 다른 서버가 완료했을 수 있으므로 DB를 한 번 더 확인한다.
            storedTranslation = findStoredPublicTranslation(resource, targetLanguage);

            if (storedTranslation != null) {
                translationCache.put(cacheKey, storedTranslation);
                return new TranslationResponse(storedTranslation, true);
            }

            String translatedText = geminiTranslationClient.translate(
                    request.getSourceLanguage(),
                    targetLanguage,
                    request.getSourceText()
            );

            savePublicTranslation(
                    resource,
                    request.getSourceLanguage(),
                    targetLanguage,
                    translatedText
            );
            translationCache.put(cacheKey, translatedText);

            return new TranslationResponse(translatedText, false);
        } finally {
            // 실패한 요청도 잠금을 풀어 다음 사용자가 재시도할 수 있게 한다.
            publicTranslationCoordinator.release(resource, targetLanguage, lockToken);
        }
    }

    private TranslationResponse waitForPublicTranslation(
            TranslationCacheResource resource,
            String targetLanguage,
            String cacheKey
    ) {
        for (int attempt = 0; attempt < WAIT_ATTEMPTS; attempt++) {
            pauseBeforeNextLookup();

            String storedTranslation = findStoredPublicTranslation(resource, targetLanguage);

            if (storedTranslation != null) {
                translationCache.put(cacheKey, storedTranslation);
                return new TranslationResponse(storedTranslation, true);
            }
        }

        throw new ApiException(
                ErrorCode.INTERNAL_ERROR,
                "다른 요청에서 번역 중입니다. 잠시 후 다시 시도해주세요."
        );
    }

    private void pauseBeforeNextLookup() {
        try {
            Thread.sleep(WAIT_INTERVAL_MILLIS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(
                    ErrorCode.INTERNAL_ERROR,
                    "번역 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요."
            );
        }
    }

    // 게시글·댓글 모두 resourceType, resourceId, contentVersion 규칙으로 공통 처리한다.
    private String findStoredPublicTranslation(
            TranslationCacheResource resource,
            String targetLanguage
    ) {
        return translationMapper.findContentTranslation(
                resource.resourceType(),
                resource.resourceId(),
                resource.contentVersion(),
                targetLanguage
        );
    }

    private void savePublicTranslation(
            TranslationCacheResource resource,
            String sourceLanguage,
            String targetLanguage,
            String translatedText
    ) {
        translationMapper.upsertContentTranslation(
                resource.resourceType(),
                resource.resourceId(),
                resource.contentVersion(),
                sourceLanguage,
                targetLanguage,
                translatedText
        );
    }
}
