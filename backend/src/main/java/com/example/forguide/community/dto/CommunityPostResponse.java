package com.example.forguide.community.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter

public class CommunityPostResponse {

    private Long postId;
    private Long memberId;
    private String nickname;
    private String profileImageUrl;
    private String content;
    private String language;
    private Integer contentVersion;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
        }
