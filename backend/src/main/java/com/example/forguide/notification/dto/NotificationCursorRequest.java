package com.example.forguide.notification.dto;


import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationCursorRequest {

    // 첫 조회에서는 null, 다음 조회부터 마지막 알림 번호를 전달한다.
    @Positive(message = "알림 커서 번호가 올바르지 않습니다.")
    private Long cursorNotificationId;

    @NotNull(message = "조회할 알림 수가 필요합니다.")
    @Min(value = 1, message = "조회할 알림 수는 1개 이상이어야 합니다.")
    @Max(value = 50, message = "한 번에 최대 50개까지만 조회할 수 있습니다.")
    private Integer size;
}
