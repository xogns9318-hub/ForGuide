package com.example.forguide.chatbot.controller;

import com.example.forguide.chatbot.dto.ChatbotHistoryResponse;
import com.example.forguide.chatbot.dto.ChatbotQuestionRequest;
import com.example.forguide.chatbot.dto.ChatbotReplyResponse;
import com.example.forguide.chatbot.service.ChatbotService;
import com.example.forguide.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 문의 챗봇 API. 모두 로그인 필요 (SecurityConfig 기본 잠금 정책을 그대로 따른다).
 */
@RestController
@RequestMapping("/api/v1/chatbot/messages")
@RequiredArgsConstructor
public class ChatbotController {

    private final ChatbotService chatbotService;

    // 화면을 열 때: 사용 가능 여부·남은 횟수·최근 대화
    @GetMapping
    public ApiResponse<ChatbotHistoryResponse> getHistory(@AuthenticationPrincipal Long memberId) {
        return ApiResponse.ok(chatbotService.getHistory(memberId));
    }

    // 질문 보내기
    @PostMapping
    public ApiResponse<ChatbotReplyResponse> ask(
            @AuthenticationPrincipal Long memberId,
            @Valid @RequestBody ChatbotQuestionRequest request
    ) {
        return ApiResponse.ok(chatbotService.ask(memberId, request));
    }

    // 대화 지우기
    @DeleteMapping
    public ApiResponse<Void> clearHistory(@AuthenticationPrincipal Long memberId) {
        chatbotService.clearHistory(memberId);
        return ApiResponse.ok();
    }
}
