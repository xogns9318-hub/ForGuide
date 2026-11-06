package com.example.forguide.notification.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.notification.config.NotificationProperties;
import com.example.forguide.notification.dto.NotificationResponse;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationSseService {

    private static final String NOTIFICATION_EVENT_NAME = "notification";
    private static final String HEARTBEAT_EVENT_NAME = "ping";

    /*
        회원 번호별로 현재 접속 중인 SSE 연결을 보관한다.
        Set을 쓰므로 같은 회원이 여러 탭을 열어도 각각 알림을 받을 수 있다.
     */

    private final Map<Long, Set<SseEmitter>> emittersByMemberId =
            new ConcurrentHashMap<>();

    private final NotificationProperties properties;

    public NotificationSseService(NotificationProperties properties) {
        this.properties = properties;
    }

    // 로그인한 회원의 브라우저 탭 하나를 SSE 알림 연결에 등록한다.
    public SseEmitter subscribe(Long memberId) {
        if (memberId == null || memberId < 1) {
            throw new IllegalArgumentException("알림을 받을 회원 정보가 올바르지 않습니다.");
        }

        SseEmitter emitter = new SseEmitter(
                properties.sseTimeout().toMillis()
        );

        boolean isSubscribed = addEmitter(memberId, emitter);

        if (!isSubscribed) {
            emitter.complete();
            throw new ApiException(ErrorCode.SSE_CONNECTION_LIMIT);
        }

        emitter.onCompletion(() -> removeEmitter(memberId, emitter));
        emitter.onTimeout(() -> removeEmitter(memberId, emitter));
        emitter.onError(error -> removeEmitter(memberId, emitter));

        try {
            // 연결 성공 여부를 프런트엔드가 알 수 있도록 최초 이벤트를 보낸다.
            emitter.send(
                    SseEmitter.event()
                            .name("connected")
                            .data("connected")
            );
        } catch (IOException | IllegalStateException exception) {
            removeEmitter(memberId, emitter);
            emitter.completeWithError(exception);
        }

        return emitter;
    }

    // DB 커밋 뒤 NotificationService가 호출해 접속 중인 모든 탭에 알림을 보낸다.
    public void send(
            Long recipientMemberId,
            NotificationResponse notification
    ) {
        Set<SseEmitter> emitters = emittersByMemberId.get(recipientMemberId);

        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : Set.copyOf(emitters)) {
            try {
                emitter.send(
                        SseEmitter.event()
                                .id(notification.getNotificationId().toString())
                                .name(NOTIFICATION_EVENT_NAME)
                                .data(notification)
                );
            } catch (IOException | IllegalStateException exception) {
                removeEmitter(recipientMemberId, emitter);
                emitter.completeWithError(exception);
            }
        }
    }

    /*
       프록시·브라우저가 조용히 끊은 연결을 주기적으로 확인한다.
       전송에 실패한 emitter는 즉시 제거해 서버 메모리에 남지 않게 한다.
    */
    @Scheduled(fixedDelayString = "${forguide.notification.sse-heartbeat-interval:15s}")
    public void sendHeartbeat() {
        emittersByMemberId.forEach((memberId, emitters) -> {
            for (SseEmitter emitter : Set.copyOf(emitters)) {
                try {
                    emitter.send(
                            SseEmitter.event()
                                    .name(HEARTBEAT_EVENT_NAME)
                                    .data("ping")
                    );
                } catch (IOException | IllegalStateException exception) {
                    removeEmitter(memberId, emitter);
                    emitter.completeWithError(exception);
                }
            }
        });
    }

    // 여러 탭이 동시에 연결해도 회원별 최대 연결 수를 넘지 않도록 원자적으로 등록한다.
    private boolean addEmitter(Long memberId, SseEmitter emitter) {
        boolean[] isSubscribed = {false};

        emittersByMemberId.compute(memberId, (ignored, currentEmitters) -> {
            Set<SseEmitter> emitters = currentEmitters == null
                    ? ConcurrentHashMap.newKeySet()
                    : currentEmitters;

            if (emitters.size() >= properties.sseMaxConnectionsPerMember()) {
                return emitters;
            }

            emitters.add(emitter);
            isSubscribed[0] = true;
            return emitters;
        });

        return isSubscribed[0];
    }

    private void removeEmitter(Long memberId, SseEmitter emitter) {
        Set<SseEmitter> emitters = emittersByMemberId.get(memberId);

        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);

        if (emitters.isEmpty()) {
            emittersByMemberId.remove(memberId, emitters);
        }
    }
}

