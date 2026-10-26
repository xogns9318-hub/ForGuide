package com.example.forguide.recommend;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
public class FastResultStore {

    public static final List<String> RESIDENCE_STATUSES = List.of(
            "비전문취업(E-9)", "방문취업(H-2)", "전문인력", "유학생", "재외동포(F-4)", "영주(F-5)", "결혼이민(F-6)", "기타");

    private final ObjectMapper objectMapper;
    private final Map<String, JsonNode> files = new ConcurrentHashMap<>();

    public FastResultStore(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public JsonNode choices(String product) {
        JsonNode file = files.computeIfAbsent(product, this::load);
        var node = objectMapper.createObjectNode();
        node.set("key_order", file.get("key_order"));
        node.set("choices", file.get("choices"));
        node.set("residence_status", objectMapper.valueToTree(RESIDENCE_STATUSES));
        return node;
    }

    public JsonNode find(String product, Map<String, String> input) {
        JsonNode file = files.computeIfAbsent(product, this::load);
        Map<String, String> errors = new LinkedHashMap<>();
        if (!RESIDENCE_STATUSES.contains(input.get("residence_status"))) {
            errors.put("residence_status", "허용값: " + String.join(", ", RESIDENCE_STATUSES));
        }

        List<String> parts = new ArrayList<>();
        for (JsonNode node : file.get("key_order")) {
            String field = node.asString();
            String value = input.get(field) == null ? null : input.get(field).trim();
            String key = toKey(field, value, file.get("choices").get(field));
            if (key == null) {
                errors.put(field, "허용값: " + describe(field, file.get("choices").get(field)));
            } else {
                parts.add(key);
            }
        }
        if (!errors.isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_INPUT, errors);
        }
        return file.get("results").get(String.join("|", parts));
    }

    private String toKey(String field, String value, JsonNode choices) {
        if (value == null) {
            return null;
        }
        if ("age".equals(field)) {
            try {
                int age = Integer.parseInt(value);
                return age >= choices.get(0).asInt() && age <= choices.get(1).asInt() ? String.valueOf(age) : null;
            } catch (NumberFormatException e) {
                return null;
            }
        }
        for (JsonNode choice : choices) {
            if (choice.asString().equals(value)) {
                return value;
            }
        }
        return null;
    }

    private String describe(String field, JsonNode choices) {
        if ("age".equals(field)) {
            return choices.get(0).asString() + "~" + choices.get(1).asString();
        }
        List<String> values = new ArrayList<>();
        choices.forEach(choice -> values.add(choice.asString()));
        return String.join(", ", values);
    }

    private JsonNode load(String product) {
        try (InputStream in = new ClassPathResource("recommend/" + product + "_fast.json").getInputStream()) {
            return objectMapper.readTree(in);
        } catch (IOException e) {
            throw new IllegalStateException("추천 결과 파일을 읽지 못했습니다: " + product, e);
        }
    }
}
