package com.example.forguide.admin.controller;

import com.example.forguide.admin.dto.AdminMemberCursorRequest;
import com.example.forguide.admin.dto.AdminMemberResponse;
import com.example.forguide.admin.dto.AdminMemberStatusUpdateRequest;
import com.example.forguide.admin.service.AdminMemberService;
import com.example.forguide.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final AdminMemberService adminMemberService;

    // 상태,검색어,커서 조건에 맞는 회원 목록을 가져온다.
    @GetMapping
    public ApiResponse<List<AdminMemberResponse>> getMembers(
            @Valid @ModelAttribute AdminMemberCursorRequest cursor
    ) {
        return ApiResponse.ok(adminMemberService.getMembers(cursor));
    }

    // 일반 회원의 상태를 ACTIVE 또는 SUSPENDED로 바꾼다.
    @PatchMapping("/{memberId}/status")
    public ApiResponse<AdminMemberResponse> updateMemberStatus(
            @PathVariable Long memberId,
            @Valid @RequestBody AdminMemberStatusUpdateRequest request
    ) {
        return ApiResponse.ok(
                adminMemberService.updateMemberStatus(
                        memberId,
                        request.memberStatus()
                )
        );
    }
}
