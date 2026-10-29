package com.example.forguide.translation.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TranslationMapper {

    // 게시글·댓글의 원문 버전과 대상 언어로 저장된 번역문을 공통 조회한다.
    String findContentTranslation(
            @Param("resourceType") String resourceType,
            @Param("resourceId") Long resourceId,
            @Param("contentVersion") Integer contentVersion,
            @Param("targetLanguage") String targetLanguage
    );

    // 같은 콘텐츠·버전·대상 언어에는 번역문 하나만 저장한다.
    int upsertContentTranslation(
            @Param("resourceType") String resourceType,
            @Param("resourceId") Long resourceId,
            @Param("contentVersion") Integer contentVersion,
            @Param("sourceLanguage") String sourceLanguage,
            @Param("targetLanguage") String targetLanguage,
            @Param("translatedContent") String translatedContent
    );

    // 게시글 또는 댓글이 삭제될 때 연결된 모든 번역문을 제거한다.
    int deleteContentTranslations(
            @Param("resourceType") String resourceType,
            @Param("resourceId") Long resourceId
    );
}