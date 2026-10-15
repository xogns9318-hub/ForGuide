package com.example.forguide.member.mapper;

import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * refresh_tokens 테이블 접근 (SQL: resources/mapper/member/RefreshTokenMapper.xml)
 * token 컬럼에는 refresh token 원문이 아니라 SHA-256 해시를 저장한다.
 */
@Mapper
public interface RefreshTokenMapper {

    int insert(@Param("memberId") Long memberId,
               @Param("tokenHash") String tokenHash,
               @Param("expiresAt") LocalDateTime expiresAt);

    /** 만료 전인 토큰의 회원 번호 (없거나 만료면 null) */
    Long findMemberIdByValidToken(@Param("tokenHash") String tokenHash, @Param("now") LocalDateTime now);

    /** 토큰 한 개 삭제. 지운 행 수를 돌려준다 (0이면 이미 쓰였거나 없는 토큰) */
    int deleteByToken(String tokenHash);

    /** 회원의 만료된 토큰 정리 */
    int deleteExpiredByMemberId(@Param("memberId") Long memberId, @Param("now") LocalDateTime now);
}
