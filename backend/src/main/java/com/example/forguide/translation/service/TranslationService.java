package com.example.forguide.translation.service;

import com.example.forguide.translation.cache.TranslationCache;
import com.example.forguide.translation.cache.TranslationCacheResource;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TranslationService {

    private final GeminiTranslationClient geminiTranslationClient;
    private final TranslationCache translationCache;

    public TranslationService(
            GeminiTranslationClient geminiTranslationClient,
            TranslationCache translationCache
    ) {
        this.geminiTranslationClient = geminiTranslationClient;
        this.translationCache = translationCache;
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

            Optional<String> cachedText = translationCache.get(cacheKey);

            if (cachedText.isPresent()) {
                return new TranslationResponse(
                        cachedText.get(),
                        true
                );
            }

            String translatedText = geminiTranslationClient.translate(
                    request.getSourceLanguage(),
                    request.getTargetLanguage(),
                    request.getSourceText()
            );

            translationCache.put(cacheKey, translatedText);

            return new TranslationResponse(translatedText, false);
        }

        String translatedText = geminiTranslationClient.translate(
                request.getSourceLanguage(),
                request.getTargetLanguage(),
                request.getSourceText()
        );

        return new TranslationResponse(translatedText, false);
    }
}