package com.example.forguide.translation.cache;

/*
    Redis 번역 캐시가 어느 공개 콘텐츠의 어느 버전인지 구분
    예 : community-post / 7번 게시글 / 내용 버전 3
 */
public record TranslationCacheResource (
    String resourceType,
    Long resourceId,
    Integer contentVersion
) {

    public TranslationCacheResource  {
        if (resourceType == null || resourceType.isBlank()) {
            throw new IllegalArgumentException("번역 캐시 대상 종류가 필요합니다.");
        }

        if (resourceId == null || resourceId < 1) {
            throw new IllegalArgumentException("번역 캐시 대상 번호가 올바르지 않습니다.");
        }

        if (contentVersion == null || contentVersion < 1) {
            throw new IllegalArgumentException("번역 캐시 내용 버전이 올바르지 않습니다.");
        }
    }
}
