package com.example.forguide.member.mapper;

import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * login_attempts 테이블 접근 (SQL: resources/mapper/member/LoginAttemptMapper.xml)
 */
@Mapper
public interface LoginAttemptMapper {

    /** 아이디의 실패 기록 (없으면 null) */
    LoginAttemptRow findByLoginId(String loginId);

    /** 첫 실패 기록 (실패 1회) */
    int insertFirstFailure(@Param("loginId") String loginId, @Param("now") LocalDateTime now);

    /** 실패 1회 추가. maxFailures번째 실패면 lockUntil까지 잠근다. 기록이 없으면 0 */
    int increaseFailure(@Param("loginId") String loginId, @Param("now") LocalDateTime now,
                        @Param("maxFailures") int maxFailures, @Param("lockUntil") LocalDateTime lockUntil);

    /** 기록 삭제 (로그인 성공, 잠금·실패 기록 만료) */
    int delete(String loginId);
}
