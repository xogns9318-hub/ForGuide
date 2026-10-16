package com.example.forguide.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityPostLikeResponse {

    private Long postId;
    private Long likeCount;
    private boolean likedByMe;
}
