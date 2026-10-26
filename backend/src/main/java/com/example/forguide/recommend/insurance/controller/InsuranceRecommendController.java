package com.example.forguide.recommend.insurance.controller;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.recommend.FastResultStore;
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

    public InsuranceRecommendController(FastResultStore store, ObjectMapper objectMapper) {
        this.store = store;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/choices")
    public ApiResponse<JsonNode> choices() {
        return ApiResponse.ok(store.choices("insurance"));
    }

    @GetMapping("/fast")
    public ApiResponse<JsonNode> fast(@RequestParam Map<String, String> params) {
        String healthInsurance = params.get("health_insurance");
        if (!HEALTH_INSURANCE.contains(healthInsurance)) {
            throw new ApiException(ErrorCode.INVALID_INPUT,
                    Map.of("health_insurance", "허용값: " + String.join(", ", HEALTH_INSURANCE)));
        }
        if (!"예".equals(healthInsurance)) {
            return ApiResponse.ok(objectMapper.createObjectNode().put("mode", "fast").put("redirect", "consultation"));
        }
        return ApiResponse.ok(store.find("insurance", params));
    }
}
