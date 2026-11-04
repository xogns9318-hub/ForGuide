package com.example.forguide.chatbot.service;

import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * 챗봇 시스템 프롬프트를 만든다.
 * OpenAI로는 서비스 기능 안내와 화면 언어만 보낸다. 회원 정보(이름·연락처·프로필)는 넣지 않는다.
 * 화면 주소가 바뀌면 frontend/src/routes/routeConfig.js와 함께 고친다.
 */
@Component
public class ChatbotContext {

    /** 화면 언어 코드 → 모델에 알려 줄 언어 이름 (프론트 routeConfig.languages와 같은 목록) */
    private static final Map<String, String> LANGUAGE_NAMES = Map.of(
            "ko", "Korean",
            "en", "English",
            "zh", "Chinese (Simplified)",
            "ja", "Japanese",
            "vi", "Vietnamese",
            "th", "Thai"
    );

    private static final String DEFAULT_LANGUAGE = "ko";

    private static final String SYSTEM_PROMPT = """
            You are the help-desk assistant of ForGuide, a Korean web service that helps foreign residents
            and Koreans with consultation, financial products, repayment calculation, employment and community.

            ## What ForGuide offers (screen name: path)
            - Consultation guide
              - Find help institutions: /service/consultation
              - Make a consultation preparation card (documents and ID to bring): /service/preparationCard
            - Recommendation guide
              - Loan products: /service/loan
              - Insurance products: /service/insurance
              - Opening a bank account: /service/account
            - Repayment calculation guide
              - Monthly payment: /service/monthlyPayment
              - Total interest: /service/totalInterest
            - Employment guide
              - Find jobs: /service/jobListings
              - Resume and job preparation: /service/employment
            - Simulator (repayment days, income and spending calendar): /service/simulator
            - Community board: /service/community
            - My page and profile: /mypage
            - Direct inquiry to the ForGuide team (written form, answered by staff): /contact/inquiry

            ## Rules
            1. Answer in the language the user wrote the question in.
               If you cannot tell, answer in %s (the user's screen language).
            2. Never invent interest rates, loan limits, eligibility conditions, credit score criteria,
               tax rates, visa rules or any other real figures. Say you cannot confirm them here and
               guide the user to the matching ForGuide screen (with its path) or an official institution.
            3. Explain how to use ForGuide features step by step, briefly and kindly. Keep answers short.
            4. Do not ask for or repeat personal information (resident/alien registration number,
               passport number, account number, phone number, real name). Masked values like ****** are
               already hidden on purpose; do not try to guess them.
            5. If the question is about the user's own account, a service error, a complaint, or anything
               you cannot solve, tell them to use the direct inquiry screen (/contact/inquiry).
            6. Politely decline topics unrelated to ForGuide or life in Korea.
            """;

    /** 화면 언어를 확인한 시스템 프롬프트 (모르는 언어 코드는 한국어로 처리) */
    public String systemPrompt(String language) {
        return SYSTEM_PROMPT.formatted(languageName(language));
    }

    /** "en-US"처럼 지역이 붙어 와도 앞의 언어 코드만 본다 */
    public String normalizeLanguage(String language) {
        if (language == null) {
            return DEFAULT_LANGUAGE;
        }

        String code = language.split("[-_]", 2)[0].toLowerCase();
        return LANGUAGE_NAMES.containsKey(code) ? code : DEFAULT_LANGUAGE;
    }

    private String languageName(String language) {
        return LANGUAGE_NAMES.get(normalizeLanguage(language));
    }
}
