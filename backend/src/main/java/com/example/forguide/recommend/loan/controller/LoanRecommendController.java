package com.example.forguide.recommend.loan.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.recommend.FastResultStore;
import com.example.forguide.recommend.usage.RecommendationType;
import com.example.forguide.recommend.usage.RecommendationOutcomeType;
import com.example.forguide.recommend.usage.RecommendationUsageService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/recommend/loan")
public class LoanRecommendController {

    private final FastResultStore store;
    private final RecommendationUsageService recommendationUsageService;

    public LoanRecommendController(FastResultStore store,
                                   RecommendationUsageService recommendationUsageService) {
        this.store = store;
        this.recommendationUsageService = recommendationUsageService;
    }

    @GetMapping("/choices")
    public ApiResponse<JsonNode> choices() {
        return ApiResponse.ok(store.choices("loan"));
    }

    @GetMapping("/fast")
    public ApiResponse<JsonNode> fast(@RequestParam Map<String, String> params) {
        JsonNode result = store.find("loan", params);

        // 유효한 조건으로 대출 추천 결과를 만든 경우에만 사용 로그를 남긴다.
        recommendationUsageService.record(
                RecommendationType.LOAN,
                RecommendationOutcomeType.PRODUCT_RESULT
        );

        return ApiResponse.ok(result);
    }
}
