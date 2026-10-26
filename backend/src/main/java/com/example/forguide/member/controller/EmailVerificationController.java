package com.example.forguide.member.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.member.dto.EmailCodeRequest;
import com.example.forguide.member.dto.EmailCodeResponse;
import com.example.forguide.member.dto.EmailVerifyRequest;
import com.example.forguide.member.dto.EmailVerifyResponse;
import com.example.forguide.member.service.EmailVerificationService;
import com.example.forguide.member.service.EmailVerificationService.SendResult;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 이메일 인증 코드 보내기·확인 (로그인 없이 호출 가능: /api/v1/auth/** 공개)
 */
@RestController
@RequestMapping("/api/v1/auth/email")
public class EmailVerificationController {

    private final EmailVerificationService verificationService;

    public EmailVerificationController(EmailVerificationService verificationService) {
        this.verificationService = verificationService;
    }

    @PostMapping("/send-code")
    public ApiResponse<EmailCodeResponse> sendCode(@Valid @RequestBody EmailCodeRequest request) {
        SendResult result = verificationService.sendCode(request.email(), request.purpose());
        return ApiResponse.ok(new EmailCodeResponse(result.expiresInSeconds(), result.resendAfterSeconds()));
    }

    @PostMapping("/verify")
    public ApiResponse<EmailVerifyResponse> verify(@Valid @RequestBody EmailVerifyRequest request) {
        String token = verificationService.verify(request.email(), request.purpose(), request.code());
        return ApiResponse.ok(new EmailVerifyResponse(token));
    }
}
