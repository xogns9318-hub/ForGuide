package com.example.forguide.community.dto;


import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter

public class CommunityCommentResponse {

   private Long commentId;
   private Long postId;
   private Long parentCommentId;
   private Long memberId;
   private String nickname;
   private String profileImageUrl;
   private String content;
   private Integer contentVersion;
   private boolean deleted;
   private LocalDateTime createdAt;
   private LocalDateTime updatedAt;
}
