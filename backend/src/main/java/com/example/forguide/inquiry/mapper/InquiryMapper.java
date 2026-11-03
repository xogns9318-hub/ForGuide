package com.example.forguide.inquiry.mapper;

import com.example.forguide.inquiry.dto.InquiryCreateRequest;
import com.example.forguide.inquiry.dto.InquiryCursorRequest;
import com.example.forguide.inquiry.dto.InquiryResponse;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface InquiryMapper {

    int insert(
            @Param("memberId") Long memberId,
            @Param("request")InquiryCreateRequest request
    );

    // 로그인한 회원은 자신의 문의만 목록으로 조회한다.
    List<InquiryResponse> findByMemberIdAndCursor(
            @Param("memberId") Long memberId,
            @Param("cursor") InquiryCursorRequest cursor
    );

    InquiryResponse findByIdAndMemberId(
            @Param("inquiryId") Long inquiryId,
            @Param("memberId") Long memberId
    );

    // 관리자는 상태를 선택해 전체 문의를 조회할 수 있다.
    List<InquiryResponse> findAllByCursor(
            @Param("cursor") InquiryCursorRequest cursor
    );

    InquiryResponse findById(Long inquiryId);

    // 아직 답변하지 않은 문의만 답변 완료 상태로 변경한다.
    int answer(
            @Param("inquiryId") Long inquiryId,
            @Param("adminMemberId") Long adminMemberId,
            @Param("answerContent") String answerContent
    );
}
