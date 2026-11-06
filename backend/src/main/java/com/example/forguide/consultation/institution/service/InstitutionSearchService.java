package com.example.forguide.consultation.institution.service;

import com.example.forguide.common.exception.ApiException;
import com.example.forguide.common.exception.ErrorCode;
import com.example.forguide.consultation.institution.dto.InstitutionSearchCriteria;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class InstitutionSearchService {

    private static final Logger log =
            LoggerFactory.getLogger(InstitutionSearchService.class);

    private final ObjectProvider<InstitutionSearchReader> readers;
    private final InstitutionSearchQueryFactory queryFactory;
    private final InstitutionSearchRules rules;
    private final InstitutionSearchResultAssembler assembler;

    public InstitutionSearchService(
            ObjectProvider<InstitutionSearchReader> readers,
            InstitutionSearchQueryFactory queryFactory,
            InstitutionSearchRules rules,
            InstitutionSearchResultAssembler assembler
    ) {
        this.readers = readers;
        this.queryFactory = queryFactory;
        this.rules = rules;
        this.assembler = assembler;
    }

    public Result search(InstitutionSearchCriteria criteria) {
        // 잘못된 분야·키워드는 검색 서버에 요청하기 전에 거절한다.
        rules.resolve(criteria);

        // 검색 기능을 끈 팀원도 다른 기능의 서버를 실행할 수 있게 선택적으로 연결한다.
        var reader = readers.getIfAvailable();

        if (reader == null) {
            throw new ApiException(
                    ErrorCode.INSTITUTION_SEARCH_UNAVAILABLE
            );
        }

        var query = queryFactory.build(criteria);

        try {
            var hits = reader.searchWithMatches(query);

            return new Result(
                    assembler.assemble(hits, criteria),
                    criteria
            );
        } catch (IllegalStateException exception) {
            // 불완전한 자료를 검색 결과 0건으로 바꾸지 않는다.
            // 검색어·기관 원문은 기록하지 않는다.
            log.warn(
                    "기관 검색 결과 구성 실패: {}",
                    exception.getClass().getSimpleName()
            );

            throw new ApiException(
                    ErrorCode.INSTITUTION_SEARCH_UNAVAILABLE
            );
        }
    }

    public record Result(
            List<InstitutionSearchResultAssembler.Item> items,
            InstitutionSearchCriteria filters
    ) {
        public Result {
            items = List.copyOf(items);
        }
    }
}