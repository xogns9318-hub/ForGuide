package com.example.forguide.admin.mapper;

import com.example.forguide.admin.dto.AdminCommunityContentCursorRequest;
import com.example.forguide.admin.dto.AdminCommunityContentResponse;
import com.example.forguide.admin.dto.AdminCommunityModerationStatus;
import com.example.forguide.admin.dto.AdminCommunityResourceType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminCommunityMapper {

    // 게시글과 댓글을 하나의 관리자 목록으로 커서 조회한다,
    List<AdminCommunityContentResponse> findContentsByCursor(
            @Param("cursor")AdminCommunityContentCursorRequest cursor
    );

    // 상대 변경 전에 실제 콘텐츠가 존재하는지, 현재 상태가 무엇인지 확인한다.
    AdminCommunityContentResponse findContentByResource(
            @Param("resourceType")AdminCommunityResourceType resourceType,
            @Param("resourceId") Long resourceId
    );

    // 같은 콘텐츠의 관리 상태는 한 행만 유지한다.
    int upsertModeration(
            @Param("resourceType") AdminCommunityResourceType resourceType,
            @Param("resourceId") Long resourceId,
            @Param("moderationStatus")
            AdminCommunityModerationStatus moderationStatus,
            @Param("reason") String reason,
            @Param("moderatedByMemberId") Long moderatedByMemberId
    );
}
