package com.example.forguide.recommend.insurance.controller;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.recommend.FastResultStore;
import com.example.forguide.recommend.usage.RecommendationOutcomeType;
import com.example.forguide.recommend.usage.RecommendationType;
import com.example.forguide.recommend.usage.RecommendationUsageService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/v1/recommend/insurance")
public class InsuranceRecommendController {

    private static final List<String> HEALTH_INSURANCE = List.of("예", "아니오", "모름");

    private final FastResultStore store;
    private final ObjectMapper objectMapper;
    private final RecommendationUsageService recommendationUsageService;

    public InsuranceRecommendController(FastResultStore store, ObjectMapper objectMapper,
                                        RecommendationUsageService recommendationUsageService) {
        this.store = store;
        this.objectMapper = objectMapper;
        this.recommendationUsageService = recommendationUsageService;
    }

    @GetMapping("/choices")
    public ApiResponse<JsonNode> choices() {
        return ApiResponse.ok(store.choices("insurance"));
    }

    @GetMapping("/fast")
    public ApiResponse<JsonNode> fast(@RequestParam Map<String, String> params) {
        String healthInsurance = params.get("health_insurance");

        if (!HEALTH_INSURANCE.contains(healthInsurance)) {
            throw new ApiException(
                    ErrorCode.INVALID_INPUT,
                    Map.of(
                            "health_insurance",
                            "허용값: " + String.join(", ", HEALTH_INSURANCE)
                    )
            );
        }

        if (!"예".equals(healthInsurance)) {
            JsonNode result = objectMapper.createObjectNode()
                    .put("mode", "fast")
                    .put("redirect", "consultation");

            // 보험 추천 흐름이 상담 안내로 이어진 경우도 사용 현황에 기록한다.
            recommendationUsageService.record(
                    RecommendationType.INSURANCE,
                    RecommendationOutcomeType.CONSULTATION_REDIRECT
            );

            return ApiResponse.ok(result);
        }

        JsonNode result = store.find("insurance", params);

        // 보험 상품 추천 결과를 만든 경우에만 사용 로그를 남긴다.
        recommendationUsageService.record(
                RecommendationType.INSURANCE,
                RecommendationOutcomeType.PRODUCT_RESULT
        );

        return ApiResponse.ok(result);
    }
}
