package com.example.forguide.member.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * customer_finances와 고용 형태 선택지(employment_types) 접근 (SQL: resources/mapper/member/CustomerFinanceMapper.xml)
 */
@Mapper
public interface CustomerFinanceMapper {

    /** 회원의 금융 정보 (아직 저장한 적 없으면 null) */
    CustomerFinanceRow findByMemberId(Long memberId);

    /** 금융 정보 수정. 행이 없으면 0 */
    int update(@Param("memberId") Long memberId, @Param("row") CustomerFinanceRow row);

    /** 처음 저장 */
    int insert(@Param("memberId") Long memberId, @Param("row") CustomerFinanceRow row);

    /** 고용 형태 코드 (번호 순) */
    List<String> findEmploymentCodes();
}
