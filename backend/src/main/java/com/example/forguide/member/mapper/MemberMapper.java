package com.example.forguide.member.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * members 테이블 접근 (SQL: resources/mapper/member/MemberMapper.xml)
 */
@Mapper
public interface MemberMapper {

    MemberRow findById(Long memberId);

    MemberRow findByLoginId(String loginId);

    /** 이메일로 찾기 (이메일은 소문자로 저장되어 있다) */
    MemberRow findByEmail(String email);

    boolean existsByLoginId(String loginId);

    boolean existsByEmail(String email);

    /** 가입. 생성된 member_id가 row.memberId에 채워진다 */
    int insert(MemberRow row);

    int updateNickname(@Param("memberId") Long memberId, @Param("nickname") String nickname);

    /** 비밀번호 변경 (password는 BCrypt 해시) */
    int updatePassword(@Param("memberId") Long memberId, @Param("password") String password);

    int updateProfileImageUrl(@Param("memberId") Long memberId, @Param("profileImageUrl") String profileImageUrl);
}
