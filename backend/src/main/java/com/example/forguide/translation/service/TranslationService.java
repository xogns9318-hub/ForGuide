package com.example.forguide.translation.service;

import com.example.forguide.translation.cache.TranslationCache;
import com.example.forguide.translation.cache.TranslationCacheResource;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import org.springframework.stereotype.Service;
import com.example.forguide.translation.mapper.TranslationMapper;
import java.util.Optional;

@Service
public class TranslationService {
    private static final String COMMUNITY_POST = "community-post";
    private final GeminiTranslationClient geminiTranslationClient;
    private final TranslationCache translationCache;
    private final TranslationMapper translationMapper;

    public TranslationService(
            GeminiTranslationClient geminiTranslationClient,
            TranslationCache translationCache,
            TranslationMapper translationMapper
    ) {
        this.geminiTranslationClient = geminiTranslationClient;
        this.translationCache = translationCache;
        this.translationMapper = translationMapper;
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
            String cacheKey = translationCache.createKey(
                    cacheResource,
                    request.getSourceLanguage(),
                    request.getTargetLanguage()
            );

            // 1. 가장 빠른 Redis 캐시 확인
            Optional<String> cachedText = translationCache.get(cacheKey);

            if (cachedText.isPresent()) {
                return new TranslationResponse(
                        cachedText.get(),
                        true
                );
            }

            // 2. Redis가 비어 있으면 DB에 영구 저장된 번역문 확인
            String storedTranslation = findStoredPublicTranslation(
                    cacheResource,
                    request.getTargetLanguage()
            );

            if (storedTranslation != null) {
                // DB에서 찾은 결과는 다음 요청을 위해 Redis에도 다시 채운다.
                translationCache.put(cacheKey, storedTranslation);

                return new TranslationResponse(
                        storedTranslation,
                        true
                );
            }

            // 3. Redis와 DB 모두 없을 때만 Gemini를 호출한다.
            String translatedText = geminiTranslationClient.translate(
                    request.getSourceLanguage(),
                    request.getTargetLanguage(),
                    request.getSourceText()
            );

            // 4. 이후 사용자를 위해 DB와 Redis에 함께 저장한다.
            savePublicTranslation(
                    cacheResource,
                    request.getSourceLanguage(),
                    request.getTargetLanguage(),
                    translatedText
            );
            translationCache.put(cacheKey, translatedText);

            return new TranslationResponse(translatedText, false);
        }

        // 이력서처럼 개인정보가 포함된 번역은 Redis와 공개 번역 DB에 저장하지 않는다.
        String translatedText = geminiTranslationClient.translate(
                request.getSourceLanguage(),
                request.getTargetLanguage(),
                request.getSourceText()
        );

        return new TranslationResponse(translatedText, false);
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