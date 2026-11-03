package com.example.forguide.translation.mapper;

import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 동시에 들어온 같은 공개 콘텐츠 번역 요청 중 하나만 Gemini를 호출하도록 작업 잠금을 관리한다.
 */
@Mapper
public interface TranslationJobMapper {

    int insertIfAbsent(
            @Param("resourceType") String resourceType,
            @Param("resourceId") Long resourceId,
            @Param("contentVersion") Integer contentVersion,
            @Param("targetLanguage") String targetLanguage,
            @Param("lockToken") String lockToken,
            @Param("lockedUntil") LocalDateTime lockedUntil
    );

    int takeExpiredJob(
            @Param("resourceType") String resourceType,
            @Param("resourceId") Long resourceId,
            @Param("contentVersion") Integer contentVersion,
            @Param("targetLanguage") String targetLanguage,
            @Param("lockToken") String lockToken,
            @Param("now") LocalDateTime now,
            @Param("lockedUntil") LocalDateTime lockedUntil
    );

    int deleteByLockToken(
            @Param("resourceType") String resourceType,
            @Param("resourceId") Long resourceId,
            @Param("contentVersion") Integer contentVersion,
            @Param("targetLanguage") String targetLanguage,
            @Param("lockToken") String lockToken
    );
}
