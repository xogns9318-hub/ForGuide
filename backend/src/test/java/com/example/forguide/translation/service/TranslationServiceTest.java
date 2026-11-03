package com.example.forguide.translation.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.example.forguide.translation.cache.TranslationCache;
import com.example.forguide.translation.cache.TranslationCacheResource;
import com.example.forguide.translation.dto.TranslationRequest;
import com.example.forguide.translation.dto.TranslationResponse;
import com.example.forguide.translation.mapper.TranslationMapper;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TranslationServiceTest {

    @Mock
    private GeminiTranslationClient geminiTranslationClient;

    @Mock
    private TranslationCache translationCache;

    @Mock
    private TranslationMapper translationMapper;

    @Mock
    private PublicTranslationCoordinator publicTranslationCoordinator;

    @InjectMocks
    private TranslationService translationService;

    @Test
    void DB_번역문이_있으면_Gemini를_다시_호출하지_않는다() {
        TranslationCacheResource resource = publicPostResource();
        TranslationRequest request = request("ko", "en", "안녕하세요");

        when(translationCache.createKey(resource, "ko", "en"))
                .thenReturn("translation:test");
        when(translationCache.get("translation:test"))
                .thenReturn(Optional.empty());
        when(translationMapper.findContentTranslation(
                "community-post", 7L, 1, "en"
        )).thenReturn("Hello");

        TranslationResponse response =
                translationService.translatePublicText(request, resource);

        assertEquals("Hello", response.translatedText());
        assertEquals(true, response.cached());
        verify(geminiTranslationClient, never()).translate(
                anyString(), anyString(), anyString()
        );
        verify(translationCache).put("translation:test", "Hello");
    }

    @Test
    void 다른_요청이_번역_중이면_Gemini를_중복_호출하지_않고_DB_결과를_기다린다() {
        TranslationCacheResource resource = publicPostResource();
        TranslationRequest request = request("ko", "en", "안녕하세요");

        when(translationCache.createKey(resource, "ko", "en"))
                .thenReturn("translation:test");
        when(translationCache.get("translation:test"))
                .thenReturn(Optional.empty());
        when(translationMapper.findContentTranslation(
                "community-post", 7L, 1, "en"
        )).thenReturn(null, "Hello");
        when(publicTranslationCoordinator.newLockToken())
                .thenReturn("lock-token");
        when(publicTranslationCoordinator.tryAcquire(resource, "en", "lock-token"))
                .thenReturn(false);

        TranslationResponse response =
                translationService.translatePublicText(request, resource);

        assertEquals("Hello", response.translatedText());
        assertEquals(true, response.cached());
        verify(geminiTranslationClient, never()).translate(
                anyString(), anyString(), anyString()
        );
    }

    @Test
    void 이력서_번역은_공개_번역_DB와_Redis를_사용하지_않는다() {
        TranslationRequest request = request("en", "ko", "Work experience");

        when(geminiTranslationClient.translate("en", "ko", "Work experience"))
                .thenReturn("경력 사항");

        TranslationResponse response = translationService.translatePrivateText(request);

        assertEquals("경력 사항", response.translatedText());
        assertEquals(false, response.cached());
        verifyNoInteractions(translationCache, translationMapper, publicTranslationCoordinator);
    }

    private TranslationCacheResource publicPostResource() {
        return new TranslationCacheResource("community-post", 7L, 1);
    }

    private TranslationRequest request(
            String sourceLanguage,
            String targetLanguage,
            String sourceText
    ) {
        TranslationRequest request = new TranslationRequest();
        request.setSourceLanguage(sourceLanguage);
        request.setTargetLanguage(targetLanguage);
        request.setSourceText(sourceText);
        return request;
    }
}
