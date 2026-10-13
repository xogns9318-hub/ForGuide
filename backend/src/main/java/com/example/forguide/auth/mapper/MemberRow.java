package com.example.forguide.auth.mapper;

import lombok.Getter;
import lombok.Setter;

/**
 * members 테이블 한 행. 암호화된 비밀번호까지 들고 있으므로 응답으로 그대로 내보내지 않는다 (MemberResponse 사용).
 */
@Getter
@Setter
public class MemberRow {

    private Long memberId;
    private String loginId;
    private String password;
    private String name;
    private String email;
    private String nickname;
    private String profileImageUrl;
}
