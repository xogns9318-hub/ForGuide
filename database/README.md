# 데이터베이스 구성

## Flyway 마이그레이션

실행용 SQL 마이그레이션은 Spring Boot가 읽는 다음 경로에 둡니다.

`../backend/src/main/resources/db/migration/`

- 파일명 규칙: `V{버전}__{설명}.sql`
- 현재 초기 버전: `V1__initialize_schema.sql`
- 테이블과 컬럼이 확정된 뒤 다음 버전부터 DDL을 추가합니다.

## MyBatis

- Java Mapper: `../backend/src/main/java/com/example/forguide/{기능}/mapper/`
- XML Mapper: `../backend/src/main/resources/mapper/{기능}/`
- JPA `entity`, `repository` 패키지는 사용하지 않습니다.
