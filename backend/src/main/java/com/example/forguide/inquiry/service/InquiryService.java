package com.example.forguide.inquiry.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.inquiry.dto.InquiryAnswerRequest;
import com.example.forguide.inquiry.dto.InquiryCreateRequest;
import com.example.forguide.inquiry.dto.InquiryCursorRequest;
import com.example.forguide.inquiry.dto.InquiryResponse;
import com.example.forguide.inquiry.mapper.InquiryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryMapper inquiryMapper;

    // 문의 작성은 INSERT 작업이므로 트랜잭션으로 처리한다.
    @Transactional
    public void createInquiry(
            Long memberId,
            InquiryCreateRequest request
    ) {
        requireLogin(memberId);

        inquiryMapper.insert(memberId, request);
    }

    // 목록 조회는 DB 상태를 바꾸지 않으므로 트랜잭션이 필요 없다.
    public List<InquiryResponse> getMyInquiries(
            Long memberId,
            InquiryCursorRequest cursor
    ) {
        requireLogin(memberId);

        return inquiryMapper.findByMemberIdAndCursor(memberId, cursor);
    }

    public InquiryResponse getMyInquiry(
            Long memberId,
            Long inquiryId
    ) {
        requireLogin(memberId);
        requireInquiryId(inquiryId);

        InquiryResponse inquiry = inquiryMapper.findByIdAndMemberId(
                inquiryId,
                memberId
        );

        if (inquiry == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "문의 내용을 찾을 수 없습니다."
            );
        }

        return inquiry;
    }

    // 관리자 전체 목록 조회도 SELECT만 수행한다.
    public List<InquiryResponse> getAllInquiries(
            InquiryCursorRequest cursor
    ) {
        return inquiryMapper.findAllByCursor(cursor);
    }

    public InquiryResponse getInquiryForAdmin(Long inquiryId) {
        requireInquiryId(inquiryId);

        InquiryResponse inquiry = inquiryMapper.findById(inquiryId);

        if (inquiry == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "문의 내용을 찾을 수 없습니다."
            );
        }

        return inquiry;
    }

    // 답변 등록은 문의 상태·답변 내용을 함께 바꾸므로 트랜잭션으로 처리한다.
    @Transactional
    public void answerInquiry(
            Long adminMemberId,
            Long inquiryId,
            InquiryAnswerRequest request
    ) {
        requireLogin(adminMemberId);
        requireInquiryId(inquiryId);

        int updatedCount = inquiryMapper.answer(
                inquiryId,
                adminMemberId,
                request.getAnswerContent().trim()
        );

        if (updatedCount > 0) {
            return;
        }

        if (inquiryMapper.findById(inquiryId) == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "문의 내용을 찾을 수 없습니다."
            );
        }

        throw new ApiException(
                ErrorCode.INVALID_INPUT,
                "이미 답변이 등록된 문의입니다."
        );
    }

    private void requireLogin(Long memberId) {
        if (memberId == null) {
            throw new ApiException(ErrorCode.AUTH_REQUIRED);
        }
    }

    private void requireInquiryId(Long inquiryId) {
        if (inquiryId == null || inquiryId < 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "문의 번호가 올바르지 않습니다."
            );
        }
    }
}