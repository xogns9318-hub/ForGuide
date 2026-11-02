package com.example.forguide.notification.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.notification.dto.NotificationCursorRequest;
import com.example.forguide.notification.dto.NotificationResponse;
import com.example.forguide.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // 로그인한 회원의 현재 브라우저 탭을 SSE 실시간 알림에 연결한다.
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(
            @AuthenticationPrincipal Long memberId
    ) {
        return notificationService.subscribe(memberId);
    }

    // 헤더 알림함에서 최신 알림부터 커서 방식으로 조회한다.
    @GetMapping
    public ApiResponse<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal Long memberId,
            @Valid @ModelAttribute NotificationCursorRequest cursor
    ) {
       return ApiResponse.ok(notificationService.getMyNotifications(memberId, cursor));
    }

    // 읽지 않은 알림 수는 벨 아이콘 배지에 사용한다.
    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount(
            @AuthenticationPrincipal Long memberId
    ) {
        return ApiResponse.ok(notificationService.getUnreadCount(memberId));
    }

    // 알림 하나를 열었을 때 본인 알림만 읽음 처리
    @PatchMapping("/{notificationId}/read")
    public ApiResponse<Void> markAsRead(
            @AuthenticationPrincipal Long memberId,
            @PathVariable Long notificationId
    ) {
        notificationService.markAsRead(memberId, notificationId);

        return ApiResponse.ok();
    }

    // 헤더 알림함의 전체 읽음 버튼에 사용한다.
    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead (
            @AuthenticationPrincipal Long memberId
    ) {
        notificationService.markAllAsRead(memberId);

        return ApiResponse.ok();
    }
}

