package com.example.forguide.community.dto;

import lombok.Getter;
import lombok.Setter;

// 커뮤니티에서 작성자 미리보기 카드에만 공개하는 회원 요약 정보
@Getter
@Setter
public class CommunityMemberPreviewResponse {

    private Long memberId;
    private String loginId;
    private String nickname;
    private String profileImageUrl;
    private Long postCount;
    private Long receivedLikeCount;
}
