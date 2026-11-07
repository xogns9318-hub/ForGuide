package com.example.forguide.notification.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.notification.config.NotificationProperties;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

class NotificationSseServiceTest {

    @Test
    void 회원별_연결_제한을_넘으면_추가_연결을_거부한다() {
        NotificationSseService service = serviceWithMaxConnections(1);

        service.subscribe(7L);

        assertThrows(ApiException.class, () -> service.subscribe(7L));
        assertEquals(1, service.activeConnectionCount(7L));
    }

    @Test
    void 종료된_SSE_연결은_회원별_목록에서_제거한다() {
        NotificationSseService service = serviceWithMaxConnections(2);
        SseEmitter emitter = service.subscribe(7L);

        service.removeEmitter(7L, emitter);

        assertEquals(0, service.activeConnectionCount(7L));
    }

    private NotificationSseService serviceWithMaxConnections(int maxConnections) {
        return new NotificationSseService(new NotificationProperties(
                Duration.ofMinutes(30),
                maxConnections,
                Duration.ofSeconds(15)
        ));
    }
}
