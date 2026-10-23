package com.example.forguide.consultation.institution.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

// 현재 DB에 등록된 실제 기관만 조회한다.
@Mapper
public interface InstitutionMapper {

    List<String> findAllDocuments();

    // 숫자 ID는 문자열 SQL 조합 대신 바인딩으로 전달한다.
    String findDocumentById(@Param("id") long id);
}