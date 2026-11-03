package com.example.forguide.recommend.usage;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecommendationUsageService {

    private final RecommendationUsageMapper recommendationUsageMapper;

    // 추천 결과를 정상적으로 만든 경우에만 운영 통계 로그를 저장한다.
    @Transactional
    public void record(
            RecommendationType recommendationType,
            RecommendationOutcomeType outcomeType
    ) {
        recommendationUsageMapper.insert(
                recommendationType,
                outcomeType
        );
    }
}
