package com.example.forguide.community.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class CommunityCommentCreateRequest {

    // null이면 일반 댓글, 값이 있으면 해당 댓글에 달리는 답글이다.
    @Positive(message = "부모 댓글 정보가 올바르지 않습니다.")
    private Long parentCommentId;

    // 답글에서 @아이디로 선택한 실제 회원의 로그인 아이디. 일반 댓글은 null이다.
    private String mentionLoginId;

    @NotBlank(message = "댓글 내용을 입력해주세요.")
    @Size(max = 1000, message = "댓글 내용은 1000자 이하여야 합니다.")
    private String content;
}
