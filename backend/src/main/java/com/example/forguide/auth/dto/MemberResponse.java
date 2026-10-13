package com.example.forguide.auth.dto;

import com.example.forguide.auth.mapper.MemberRow;

/**
 * 로그인한 본인에게 돌려주는 회원 정보. 비밀번호는 넣지 않는다.
 */
public record MemberResponse(
        Long memberId,
        String loginId,
        String name,
        String email,
        String nickname,
        String profileImageUrl) {

    public static MemberResponse from(MemberRow row) {
        return new MemberResponse(row.getMemberId(), row.getLoginId(), row.getName(), row.getEmail(),
                row.getNickname(), row.getProfileImageUrl());
    }
}
