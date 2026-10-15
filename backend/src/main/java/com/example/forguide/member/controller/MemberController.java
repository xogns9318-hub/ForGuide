package com.example.forguide.member.controller;

import com.example.forguide.member.common.ApiResponse;
import com.example.forguide.member.dto.MemberResponse;
import com.example.forguide.member.dto.NicknameRequest;
import com.example.forguide.member.service.MemberService;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 로그인한 본인의 닉네임·프로필 이미지 저장 (로그인 필요).
 * 회원 번호는 요청 값으로 받지 않고 토큰에서만 꺼낸다 (남의 정보를 바꾸지 못하게).
 */
@RestController
@RequestMapping("/api/v1/members/me")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PatchMapping("/nickname")
    public ApiResponse<MemberResponse> updateNickname(@AuthenticationPrincipal Long memberId,
                                                      @RequestBody NicknameRequest request) {
        return ApiResponse.ok(memberService.updateNickname(memberId, request.nickname()));
    }

    @PatchMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MemberResponse> updateProfileImage(@AuthenticationPrincipal Long memberId,
                                                          @RequestPart("image") MultipartFile image) {
        return ApiResponse.ok(memberService.updateProfileImage(memberId, image));
    }
}
