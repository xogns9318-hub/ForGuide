package com.example.forguide.member.dto;

import com.example.forguide.member.mapper.MemberRow;

/**
 * 로그인한 본인에게 돌려주는 회원 정보. 비밀번호는 넣지 않는다.
 */
public record MemberResponse(
        Long memberId,
        String loginId,
        String name,
        String givenName,
        String familyName,
        String email,
        String nickname,
        String profileImageUrl,
        String role) {           // USER / ADMIN — 화면에서 관리자 메뉴를 보일지 정할 때 쓴다 (권한 확인은 서버가 한다)

    public static MemberResponse from(MemberRow row) {
        return new MemberResponse(row.getMemberId(), row.getLoginId(), row.getName(), row.getGivenName(),
                row.getFamilyName(), row.getEmail(), row.getNickname(), row.getProfileImageUrl(), row.getRole());
    }
}
