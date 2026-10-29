package com.example.forguide.translation.service;

import com.example.forguide.translation.cache.TranslationCache;
import com.example.forguide.translation.cache.TranslationCacheResource;
import com.example.forguide.translation.mapper.TranslationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PublicTranslationInvalidator {

    private final TranslationMapper translationMapper;
    private final TranslationCache translationCache;

    /*
        게시글, 댓글 원문이 수정 또는 삭제될 때 호출
        DB 번역문 삭제는 호출한 서비스의 트랜잭션에 포함된다.
        Redis 캐시 삭제는 DB 커밋 성공 뒤에만 실행된다.
     */

    public void invalidate(
            TranslationCacheResource resource,
            String sourceLanguage
    ) {
        // 이전 버전까지 포함해 해당 공개 콘텐츠의 DB 번역문을 모두 제거한다.
        translationMapper.deleteContentTranslations(
                resource.resourceType(),
                resource.resourceId()
        );

        // DB 롤백 시 캐시만 먼저 사라지는 일을 막는다.
        translationCache.evictAfterCommit(resource, sourceLanguage);
    }
}
