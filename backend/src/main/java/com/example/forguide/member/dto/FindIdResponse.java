package com.example.forguide.member.dto;

/** 아이디 찾기 결과: 일부를 가린 아이디 (예: demouser → demo***) */
public record FindIdResponse(String maskedLoginId) {
}
