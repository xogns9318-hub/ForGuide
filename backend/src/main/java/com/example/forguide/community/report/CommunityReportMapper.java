package com.example.forguide.community.report;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CommunityReportMapper {

    @Options(
            useGeneratedKeys = true,
            keyProperty = "command.reportId",
            keyColumn = "report_id"
    )
    int insert(@Param("command") CommunityReportCreateCommand command);

    int insertImage(
            @Param("reportId") Long reportId,
            @Param("imageUrl") String imageUrl,
            @Param("displayOrder") int displayOrder
    );

    CommunityReportImageResponse findImageByIdAndReportIdAndReporterMemberId(
            @Param("reportId") Long reportId,
            @Param("reportImageId") Long reportImageId,
            @Param("reporterMemberId") Long reporterMemberId
    );

    CommunityReportImageResponse findImageByIdAndReportId(
            @Param("reportId") Long reportId,
            @Param("reportImageId") Long reportImageId
    );

    List<CommunityReportImageResponse> findImagesByReportIdAndReporterMemberId(
            @Param("reportId") Long reportId,
            @Param("reporterMemberId") Long reporterMemberId
    );

    List<CommunityReportImageResponse> findImagesByReportId(
            @Param("reportId") Long reportId
    );

    // 특정 게시글·댓글에 대해 아직 처리되지 않은 신고자만 가져온다.
    List<CommunityReportRecipient> findPendingRecipientsByResource(
            @Param("resourceType") CommunityReportResourceType resourceType,
            @Param("resourceId") Long resourceId
    );

    // 신고 기각 전에 해당 신고가 아직 처리되지 않았는지 확인한다.
    CommunityReportRecipient findPendingRecipientByReportId(
            @Param("reportId") Long reportId
    );

    // 같은 신고를 두 관리자가 동시에 처리해도 PENDING일 때 한 번만 상태를 바꾼다.
    int updateStatusIfPending(
            @Param("reportId") Long reportId,
            @Param("reportStatus") CommunityReportStatus reportStatus,
            @Param("handledByMemberId") Long handledByMemberId
    );
}
