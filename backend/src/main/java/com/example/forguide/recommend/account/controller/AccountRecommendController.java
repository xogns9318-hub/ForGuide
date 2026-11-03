package com.example.forguide.recommend.account.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.recommend.FastResultStore;
import com.example.forguide.recommend.usage.RecommendationOutcomeType;
import com.example.forguide.recommend.usage.RecommendationType;
import com.example.forguide.recommend.usage.RecommendationUsageService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/v1/recommend/account")
public class AccountRecommendController {

    private final FastResultStore store;
    private final RecommendationUsageService recommendationUsageService;

    public AccountRecommendController(FastResultStore store,
                                      RecommendationUsageService recommendationUsageService) {
        this.store = store;
        this.recommendationUsageService = recommendationUsageService;
    }

    @GetMapping("/choices")
    public ApiResponse<JsonNode> choices() {
        return ApiResponse.ok(store.choices("account"));
    }

    @GetMapping("/fast")
    public ApiResponse<JsonNode> fast(@RequestParam Map<String, String> params) {
        JsonNode result = store.find("account", params);

        // 유효한 조건으로 계좌 추천 결과를 만든 경우에만 사용 로그를 남긴다.
        recommendationUsageService.record(
                RecommendationType.ACCOUNT,
                RecommendationOutcomeType.PRODUCT_RESULT
        );

        return ApiResponse.ok(result);
    }
}
