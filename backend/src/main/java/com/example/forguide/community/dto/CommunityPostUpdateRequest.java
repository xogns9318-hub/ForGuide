package com.example.forguide.community.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityPostUpdateRequest {

    @NotBlank(message = "게시글 내용을 입력해주세요.")
    @Size(max = 5000, message = "게시글 내용은 5000자 이하여야 합니다.")
    private String content;
}
