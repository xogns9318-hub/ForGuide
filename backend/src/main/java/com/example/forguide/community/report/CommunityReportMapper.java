package com.example.forguide.community.report;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommunityReportMapper {

    int insert(
            @Param("reporterMemberId") Long reporterMemberId,
            @Param("resourceType") CommunityReportResourceType resourceType,
            @Param("resourceId") Long resourceId,
            @Param("reportReason") CommunityReportReason reportReason
    );
}
