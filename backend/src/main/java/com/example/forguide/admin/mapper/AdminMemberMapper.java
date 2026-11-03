package com.example.forguide.admin.mapper;

import com.example.forguide.admin.dto.AdminMemberCursorRequest;
import com.example.forguide.admin.dto.AdminMemberResponse;
import com.example.forguide.admin.dto.AdminMemberStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminMemberMapper {

    // 관리자 회원 목록: 상태,검색어,커서 조건으로 필요한 회원만 가져온다.
    List<AdminMemberResponse> findAllByCursor(
            @Param("cursor")AdminMemberCursorRequest cursor
    );

    AdminMemberResponse findById(
            @Param("memberId") Long memberId
    );

    // 일반 회원만 정지,해제할 수 있다. 관리자는 이 SQL로 변경되지 않는다.
    int updateStatusForUser(
            @Param("memberId") Long memberId,
            @Param("memberStatus")AdminMemberStatus memberStatus
    );
}
