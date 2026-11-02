package com.example.forguide.notification.mapper;

import com.example.forguide.notification.dto.NotificationCreateCommand;
import com.example.forguide.notification.dto.NotificationCursorRequest;
import com.example.forguide.notification.dto.NotificationResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface NotificationMapper {

    // 알림을 저장하고 MyBatis가 생성된 notificationId를 command에 넣는다.
    int insert(NotificationCreateCommand command);

    // SSE 전송에 사용할 완성된 알림 한 건을 조회한다.
    NotificationResponse findById(
            @Param("notificationId") Long notificationId
    );

    // 로그인한 회원의 알림을 최신순 커서 방식으로 조회한다.
    List<NotificationResponse> findByRecipientIdAndCursor(
            @Param("recipientMemberId") Long recipientMemberId,
            @Param("cursor") NotificationCursorRequest cursor
    );

    // 헤더 종 아이콘 배지에 표시할 읽지 않은 알림 개수다.
    long countUnreadByRecipientMemberId(
            @Param("recipientMemberId") Long recipientMemberId
    );

    // 본인 알림 한 건만 읽음 처리한다.
    int markAsRead(
            @Param("notificationId") Long notificationId,
            @Param("recipientMemberId") Long recipientMemberId
    );

    // 알림함의 “모두 읽음” 버튼에 사용한다.
    int markAllAsRead(
            @Param("recipientMemberId") Long recipientMemberId
    );

    // 인기 순위 단계 알림이 이미 생성됐는지 확인한다.
    boolean existsByNotificationEventKey(
            @Param("notificationEventKey") String notificationEventKey
    );
}