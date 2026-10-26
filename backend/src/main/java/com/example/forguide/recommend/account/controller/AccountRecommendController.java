package com.example.forguide.recommend.account.controller;

import com.example.forguide.common.response.ApiResponse;
import com.example.forguide.recommend.FastResultStore;
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

    public AccountRecommendController(FastResultStore store) {
        this.store = store;
    }

    @GetMapping("/choices")
    public ApiResponse<JsonNode> choices() {
        return ApiResponse.ok(store.choices("account"));
    }

    @GetMapping("/fast")
    public ApiResponse<JsonNode> fast(@RequestParam Map<String, String> params) {
        return ApiResponse.ok(store.find("account", params));
    }
}
