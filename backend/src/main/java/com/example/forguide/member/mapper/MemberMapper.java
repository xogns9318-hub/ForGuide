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

    boolean existsByLoginId(String loginId);

    boolean existsByEmail(String email);

    /** 가입. 생성된 member_id가 row.memberId에 채워진다 */
    int insert(MemberRow row);

    int updateNickname(@Param("memberId") Long memberId, @Param("nickname") String nickname);

    int updateProfileImageUrl(@Param("memberId") Long memberId, @Param("profileImageUrl") String profileImageUrl);
}
