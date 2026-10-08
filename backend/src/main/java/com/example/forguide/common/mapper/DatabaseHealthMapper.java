package com.example.forguide.common.mapper;

import org.apache.ibatis.annotations.Mapper;

/**
 * DB 연결 상태를 확인하는 공통 매퍼다. 기능별 매퍼도 동일하게 각 기능 패키지에 둔다.
 */
@Mapper
public interface DatabaseHealthMapper {

    int ping();
}
