# 백엔드 구조

백엔드는 기능 우선 구조를 사용하고, 각 기능 안에서 Controller · DTO · Service · Mapper를 분리한다.

```text
backend/src/main/java/com/example/forguide/
├─ common/                 # 설정, 예외, 공통 응답
├─ member/                 # 회원·프로필
├─ consultation/           # 상담
│  ├─ institution/         # 기관 검색·상세
│  └─ issuecard/           # 문제 카드
├─ recommend/
│  ├─ loan/                # 대출 추천
│  │  └─ calculator/       # 추천 상품 맞춤 계산
│  ├─ account/
│  └─ insurance/
├─ employment/
├─ community/
├─ translation/
└─ home/
```

각 기능의 SQL은 `resources/mapper/`에 동일한 기능 경로로 둔다. DB 스키마 변경은 `resources/db/migration/`의 Flyway SQL 파일로만 관리한다.

프론트엔드와 AI는 API를 통해 백엔드와 연결하므로 MyBatis Mapper나 Flyway SQL을 포함하지 않는다.
