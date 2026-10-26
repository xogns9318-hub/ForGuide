package com.example.forguide.member.mapper;

import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * email_verifications 테이블 접근 (SQL: resources/mapper/member/EmailVerificationMapper.xml)
 */
@Mapper
public interface EmailVerificationMapper {

    /** 새 인증 코드 발급 기록. 생성된 번호가 row.verificationId에 채워진다 */
    int insert(EmailVerificationRow row);

    /** 이메일·목적별로 가장 최근에 보낸 코드 (없으면 null) */
    EmailVerificationRow findLatest(@Param("email") String email, @Param("purpose") String purpose);

    /** since 이후 보낸 코드 수 (하루 발송 한도 확인용) */
    int countSentSince(@Param("email") String email, @Param("purpose") String purpose,
                       @Param("since") LocalDateTime since);

    /** 코드를 틀린 횟수 1 증가 */
    int increaseFailedAttempts(Long verificationId);

    /** 코드 확인 성공: 인증 완료 시각과 인증 완료 토큰(해시) 저장 */
    int markVerified(@Param("verificationId") Long verificationId,
                     @Param("verifiedAt") LocalDateTime verifiedAt,
                     @Param("tokenHash") String tokenHash,
                     @Param("tokenExpiresAt") LocalDateTime tokenExpiresAt);

    /** 인증 완료 토큰(해시)으로 찾기 (없으면 null) */
    EmailVerificationRow findByTokenHash(String tokenHash);

    /** 토큰 사용 처리. 아직 안 쓴 토큰일 때만 바뀌므로, 바뀐 행이 1이어야 성공 (동시에 두 번 써도 한 번만 성공) */
    int markTokenUsed(@Param("verificationId") Long verificationId, @Param("usedAt") LocalDateTime usedAt);
}
