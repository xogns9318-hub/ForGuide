package com.example.forguide.community.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityPostCreateRequest {

    private Long memberId;
    private Long postId;

    @Size(max = 5000, message = "게시글 내용은 5000자 이하여야 합니다.")
    private String content;

    @NotBlank(message = "카테고리를 선택해주세요.")
    private String category;
    private String relatedService;

    @NotBlank(message = "언어를 선택해주세요.")
    private String language;
}
