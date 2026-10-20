package com.example.forguide.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommunityCommentLikeResponse {

    private Long commentId;
    private Long likeCount;
    private boolean likedByMe;
}
