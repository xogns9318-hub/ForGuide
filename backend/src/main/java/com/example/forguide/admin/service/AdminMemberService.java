package com.example.forguide.admin.service;

import com.example.forguide.admin.dto.AdminMemberCursorRequest;
import com.example.forguide.admin.dto.AdminMemberResponse;
import com.example.forguide.admin.dto.AdminMemberStatus;
import com.example.forguide.admin.mapper.AdminMemberMapper;
import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.member.mapper.RefreshTokenMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminMemberService {

    private final AdminMemberMapper adminMemberMapper;
    private final RefreshTokenMapper refreshTokenMapper;

    public List<AdminMemberResponse> getMembers(
            AdminMemberCursorRequest cursor
    ) {
        cursor.setKeyword(normalizeKeyword(cursor.getKeyword()));

        return adminMemberMapper.findAllByCursor(cursor);
    }

    // 회원 상태를 바꾸고, 변경된 결과를 반환한다.
    @Transactional
    public AdminMemberResponse updateMemberStatus(
            Long memberId, AdminMemberStatus memberStatus
    ) {
        if (memberId == null || memberId < 1) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "회원 번호가 올바르지 않습니다."
            );
        }

        if (memberStatus == null) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    "변경할 회원 상태가 필요합니다."
            );
        }

        AdminMemberResponse member = adminMemberMapper.findById(memberId);

        if (member == null) {
            throw new ApiException(
                    ErrorCode.NOT_FOUND,
                    "회원을 찾을 수 없습니다."
            );
        }

        // 관리자 계정은 정지,해제 대상이 아닙니다.
        if (!"USER".equals(member.getRole())) {
            throw new ApiException(
                    ErrorCode.FORBIDDEN,
                    "관리자 계정의 상태는 변경할 수 없습니다."
            );
        }

        adminMemberMapper.updateStatusForUser(memberId, memberStatus);

        if (memberStatus == AdminMemberStatus.SUSPENDED) {
            refreshTokenMapper.deleteByMemberId(memberId);
        }

        return adminMemberMapper.findById(memberId);
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null) {
            return null;
        }

        String normalized = keyword.trim();

        return normalized.isEmpty() ? null : normalized;
    }
}
