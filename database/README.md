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

## 기관 검색 — 로컬 Elasticsearch

### 준비 사항

- Docker Desktop을 실행한다.
- 프로젝트 루트에서 명령을 실행한다.
- Elasticsearch 9.4.7과 Nori 한국어 분석기를 사용한다.
- 각 PC의 Elasticsearch 데이터는 별도로 저장된다.
- Git pull만으로 다른 PC의 검색 데이터까지 복사되지는 않는다.
- 백엔드에는 기존 MySQL 연결 설정이 필요하다.

### 최초 실행

```powershell
cd C:\workspace\ForGuide
docker compose --profile search up -d --build --wait --wait-timeout 180 elasticsearch
docker compose --profile search ps elasticsearch
```

컨테이너가 healthy 상태인지 확인한다.

처음에는 검색 자료가 없으므로 IntelliJ의 백엔드 프로그램 인수에 다음 두 줄을 넣고 실행한다.

```text
--forguide.search.elasticsearch.enabled=true
--forguide.search.elasticsearch.reindex-on-start=true
```

default 프로파일은 공용 DB를 사용하고, verify 프로파일은 검증용 DB를 사용한다.
복사할 원본 DB에 맞는 프로파일과 연결 설정을 사용한다.

로그에서 다음 항목을 확인한다.

- DB 연결 확인 성공
- Elasticsearch 연결 확인 성공
- Nori 한국어 분석 확인
- 기관 검색 자료 복사 완료
- MySQL 기관 수와 Elasticsearch 기관 수 일치

복사가 성공하면 백엔드를 중지하고 reindex-on-start 인수를 제거한 뒤 다시 실행한다.

### 일반 실행

Docker Desktop을 켜고 Elasticsearch를 실행한다.

```powershell
cd C:\workspace\ForGuide
docker compose --profile search up -d --wait --wait-timeout 180 elasticsearch
```

백엔드 프로그램 인수는 다음 한 줄을 사용한다.

```text
--forguide.search.elasticsearch.enabled=true
```

프론트엔드를 실행한다.

```powershell
cd C:\workspace\ForGuide\frontend
npm run dev
```

### 기관 정보가 변경된 경우

MySQL 변경 내용이 Elasticsearch에 자동 반영되지는 않는다.

백엔드를 중지하고 최초 실행과 같은 두 인수를 넣어 다시 실행한다.
복사 완료와 기관 수 일치를 확인한 뒤 reindex-on-start 인수를 제거하고 재실행한다.

복사는 MySQL 원본을 읽어서 Elasticsearch에 반영한다.
MySQL 기관 데이터는 수정하지 않는다.
새 인덱스에 복사한 뒤 검색 별칭을 교체하며, 복사가 실패하면 기존 검색 자료를 유지한다.

### 저장된 기관 수 확인

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:9200/forguide-institutions/_count" |
    Select-Object count
```

기관 수는 원본 DB에 따라 달라질 수 있다.

### Elasticsearch를 사용하지 않는 경우

백엔드 프로그램 인수에 다음 값을 지정한다.

```text
--forguide.search.elasticsearch.enabled=false
```

검색 기능이 비활성화되어도 백엔드와 기존 MySQL 기관 조회는 사용할 수 있다.
도움 기관 안내 화면의 검색은 이용 불가 안내를 표시하며, 기존 검색으로 자동 전환하지 않는다.

### 종료

```powershell
cd C:\workspace\ForGuide
docker compose --profile search stop elasticsearch
```

중지해도 저장된 검색 데이터는 유지된다.
백엔드와 프론트엔드는 각각 별도로 종료한다.