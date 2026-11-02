package com.example.forguide.member.mapper;

import com.example.forguide.member.dto.MemberProfileResponse.Choice;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * member_profiles와 선택지 표(residence_types·visa_types) 접근 (SQL: resources/mapper/member/MemberProfileMapper.xml)
 */
@Mapper
public interface MemberProfileMapper {

    /** 회원의 프로필 (아직 저장한 적 없으면 null) */
    MemberProfileRow findByMemberId(Long memberId);

    /** 프로필 수정. 행이 없으면 0 */
    int update(@Param("memberId") Long memberId, @Param("row") MemberProfileRow row);

    /** 처음 저장 */
    int insert(@Param("memberId") Long memberId, @Param("row") MemberProfileRow row);

    /** 체류자격(비자)만 수정 (내 금융 정보 화면에서). 행이 없으면 0 */
    int updateVisa(@Param("memberId") Long memberId, @Param("visaTypeCode") String visaTypeCode);

    /** 체류자격(비자)만 넣어 처음 저장 (사용 언어는 DB 기본값) */
    int insertVisa(@Param("memberId") Long memberId, @Param("visaTypeCode") String visaTypeCode);

    /** 체류 유형 선택지 (번호 순) */
    List<Choice> findResidenceTypes();

    /** 체류자격 선택지 (번호 순 = 추천 질문 목록 순서) */
    List<Choice> findVisaTypes();
}
