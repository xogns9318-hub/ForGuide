package com.example.forguide.community.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class CommunityPostImageResponse {

    private Long imageId;
    private Long postId;
    private String imageUrl;
    private Integer displayOrder;
}
