package com.example.forguide.recommend.usage;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RecommendationUsageMapper {

    int insert(
            @Param("recommendationType")
            RecommendationType recommendationType,
            @Param("outcomeType")
            RecommendationOutcomeType outcomeType
    );
}
