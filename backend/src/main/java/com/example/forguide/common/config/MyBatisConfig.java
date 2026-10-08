package com.example.forguide.common.config;

import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

/**
 * XML 기반 SQL 매퍼를 기능 패키지에 추가할 때 자동으로 Spring 빈으로 등록한다.
 */
@Configuration
@MapperScan(
        basePackages = "com.example.forguide",
        annotationClass = Mapper.class
)
public class MyBatisConfig {
}
