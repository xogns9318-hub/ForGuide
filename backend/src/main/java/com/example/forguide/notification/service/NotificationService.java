package com.example.forguide.notification.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.common.transaction.AfterCommitExecutor;
import com.example.forguide.notification.dto.NotificationCreateCommand;
import com.example.forguide.notification.dto.NotificationCursorRequest;
import com.example.forguide.notification.dto.NotificationResponse;
import com.example.forguide.notification.mapper.NotificationMapper;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Objects;


@Service
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final NotificationSseService notificationSseService;
    private final AfterCommitExecutor afterCommitExecutor;

    public NotificationService(
            NotificationMapper notificationMapper,
            NotificationSseService notificationSseService,
            AfterCommitExecutor afterCommitExecutor
    ) {
        this.notificationMapper = notificationMapper;
        this.notificationSseService = notificationSseService;
        this.afterCommitExecutor = afterCommitExecutor;
    }

    /*
        커뮤니티 서비스의 기존 쓰기 트랜잭션에 함게 참여.
        DB에 저장된 뒤, 실제 커밋에 성공했을 때만 SSE를 전송한다.
     */

    @Transactional
    public void createNotification(NotificationCreateCommand command) {
        if (Objects.equals(
                command.getRecipientMemberId(),
                command.getActorMemberId()
        )) {
            return;
        }

        if (command.getNotificationEventKey() != null
                && notificationMapper.existsByNotificationEventKey(
                        command.getNotificationEventKey()
        )) {
            return;
        }

        try {
            notificationMapper.insert(command);
        } catch (DuplicateKeyException exception) {
            /*
                인기 순위 알림처럼 event key가 있는 알림은
                동시에 요청되어도 DB의 UNIQUE 제약조건으로 한 번만 저장한다.
             */
            if (command.getNotificationEventKey() != null) {
                return;
            }
            throw exception;
        }

        NotificationResponse notification = notificationMapper.findById(
                command.getNotificationId()
        );

        if (notification == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "저장한 알림을 찾을 수 없습니다."
            );
        }

        afterCommitExecutor.runAfterCommitOrNow(
                () -> notificationSseService.send(
                        command.getRecipientMemberId(),
                        notification
                )
        );
    }

    // 알림 목록 조회는 상태를 바꾸지 않으므로 트랜잭션을 걸지 x
    public List<NotificationResponse> getMyNotifications(
            Long memberId,
            NotificationCursorRequest cursor
    ) {
        requireLogin(memberId);

        return notificationMapper.findByRecipientIdAndCursor(
                memberId, cursor);
    }

    // 읽지 않은 알림 수 조회도 단순 SELECT이므로 트랜잭션이 필요 없다.
    public long getUnreadCount(Long memberId) {
        requireLogin(memberId);

        return notificationMapper.countUnreadByRecipientMemberId(memberId);
    }

    public SseEmitter subscribe(Long memberId) {
        requireLogin(memberId);

        return notificationSseService.subscribe(memberId);
    }

    @Transactional
    public void markAsRead(Long memberId, Long notificationId) {
        requireLogin(memberId);

        if  (notificationId == null || notificationId < 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "알림 번호가 올바르지 않습니다."
            );
        }

        int updatedCount = notificationMapper.markAsRead(
                notificationId, memberId
        );

        if (updatedCount == 0) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "알림을 찾을 수 없습니다."
            );
        }
    }

    @Transactional
    public void markAllAsRead(Long memberId) {
        requireLogin(memberId);

        notificationMapper.markAllAsRead(memberId);
    }

    private void requireLogin(Long memberId) {
        if (memberId == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
    }
}
