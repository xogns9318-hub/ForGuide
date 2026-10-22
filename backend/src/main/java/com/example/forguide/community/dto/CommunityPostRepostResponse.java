package com.example.forguide.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class CommunityPostRepostResponse {

    private Long postId;
    private Long repostCount;
    private boolean repostedByMe;
}
