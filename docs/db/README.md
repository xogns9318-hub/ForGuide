# ForGuide 데이터베이스 안내

## 1. 문서 목적

팀에서 사용하는 공용 DB와 검증용 DB의 구성,
접속 방법, 실행 설정, 변경 이력 관리 방법을 기록한다.

DB 생성·변경 기록은 [change-history.md](./change-history.md)에서 관리한다.

## 2. DB 구성

MySQL 서버는 공용 PC에서 실행한다.

각 팀원의 노트북이나 PC에서는 MySQL Workbench 또는
백엔드 애플리케이션을 통해 공용 PC의 MySQL 서버에 접속한다.

| 구분 | DB 이름 | 용도 |
| --- | --- | --- |
| 공용 DB | forguide | 팀의 기능 개발과 데이터 조회·저장 |
| 검증용 DB | forguide_verify | 공용 DB와 분리하여 DB 변경 SQL 검증 |

검증용 DB 생성 여부와 현재 테이블 상태는 실제 서버에서 확인한다.

## 3. 접속 정보

| 항목 | 공용 DB | 검증용 DB |
| --- | --- | --- |
| 서버 주소 | 192.168.10.6 | 192.168.10.6 |
| 포트 | 3306 | 3306 |
| DB 이름 | forguide | forguide_verify |
| 계정 | forguide_user | forguide_verify_user |
| 비밀번호 | 팀에서 공유한 접속 정보 참고 | 팀에서 공유한 접속 정보 참고 |

서버 주소가 변경되면 이 문서와 실행 설정을 함께 확인한다.

계정별 실제 권한은 DB에서 별도로 확인한다.
기존 공용 DB의 접근 권한이 검증용 DB에도 자동으로 적용되는 것은 아니다.

## 4. MySQL Workbench 접속 방법

1. MySQL Workbench를 실행한다.
2. MySQL Connections 옆의 + 버튼을 누른다.
3. 서버 주소, 포트, 계정과 비밀번호를 입력한다.
4. Default Schema에 사용할 DB 이름을 입력한다.
5. Test Connection으로 연결을 확인한다.
6. 연결을 저장한다.

검증용 연결은 이름을 `ForGuide 검증 DB`로 지정하면 구분하기 쉽다.

## 5. 백엔드 연결 설정

### 일반 실행

설정 파일:

`backend/src/main/resources/application.properties`

별도의 활성 프로필 설정이 없는 경우 공용 DB 연결 설정을 사용한다.

이 파일의 DB_URL, DB_USERNAME, DB_PASSWORD 환경변수로
연결 정보를 덮어쓸 수 있다.

### 검증용 실행

설정 파일:

`backend/src/main/resources/application-verify.properties`

verify 프로필을 활성화하면 검증용 DB 연결 설정을 사용한다.

프로젝트 루트에서 실행한다.

```powershell
.\backend\gradlew.bat -p .\backend bootRun --args="--spring.profiles.active=verify"
```

검증용 설정 파일은 다음 DB와 계정을 사용한다.

- DB: forguide_verify
- 계정: forguide_verify_user

현재 검증용 설정 파일에는 DB 비밀번호가 직접 설정되어 있다.

JWT_SECRET 등 백엔드에서 별도로 요구하는 실행 환경 설정도 필요하다.

## 6. 파악된 테이블

| 테이블 | 용도 | 확인 상태 |
| --- | --- | --- |
| members | 회원 정보 관리 | 실제 컬럼·제약조건 최신 상태 확인 필요 |
| refresh_tokens | 로그인 유지와 토큰 재발급 관리 | 팀원이 생성했다고 공유받음. 상세 구조 확인 필요 |
| community_posts | 커뮤니티 게시글 관리 | 백엔드 코드에서 사용. 실제 생성 상태 확인 필요 |

위 목록이 전체 테이블 목록을 의미하지는 않는다.
실제 DB를 확인한 뒤 추가·수정한다.

## 7. Flyway 관리

실행용 마이그레이션 SQL 위치:

`backend/src/main/resources/db/migration/`

파일명 규칙:

`V{버전}__{설명}.sql`

현재 저장소에서 확인한 파일:

| 파일 | 내용 |
| --- | --- |
| V1__initialize_schema.sql | 초기 안내 주석만 있으며 테이블 생성 SQL은 없음 |

따라서 현재 마이그레이션 파일만으로 빈 DB에서
회원·토큰·커뮤니티 테이블 전체를 생성할 수 있는 상태는 아니다.

공용 DB에서 직접 실행한 변경 사항과
저장소의 마이그레이션 파일이 일치하는지 확인해야 한다.

이미 적용된 마이그레이션은 임의로 수정하지 않고,
팀원과 실행 이력을 확인한 뒤 다음 변경을 관리한다.

## 8. 검증용 DB 사용 방법

1. 검증할 SQL과 실행 대상을 확인한다.
2. 검증용 DB의 현재 테이블과 Flyway 이력을 확인한다.
3. 검증용 연결 또는 verify 프로필을 선택한다.
4. 마이그레이션을 실행한다.
5. 테이블·컬럼·제약조건과 실행 결과를 확인한다.
6. 검증 결과를 변경 이력 문서에 기록한다.

여러 사람이 같은 검증 DB를 사용하면 이전 실행 이력이 남는다.
처음부터 생성하는 검증은 팀원과 사용 순서를 맞추거나
개인별 검증 DB를 분리한다.

## 9. 상태 확인 SQL

### 현재 연결 확인

```sql
SELECT DATABASE() AS current_database,
       CURRENT_USER() AS current_account;
```

### 테이블 목록 확인

```sql
SHOW TABLES FROM forguide;
SHOW TABLES FROM forguide_verify;
```

### 회원 테이블 구조와 인덱스 확인

```sql
SHOW CREATE TABLE forguide.members;
SHOW INDEX FROM forguide.members;
```

### 토큰 테이블 구조 확인

```sql
SHOW CREATE TABLE forguide.refresh_tokens;
```

### 현재 접속 계정의 권한 확인

```sql
SHOW GRANTS;
```

## 10. 자동 테스트 DB와의 차이

백엔드 자동 테스트는 H2 메모리 DB를 사용한다.

관련 파일:

- backend/src/test/resources/application.properties
- backend/src/test/resources/member/schema.sql

회원 관련 테스트는 테스트용 SQL로 테이블을 생성한다.

따라서 H2 테스트 통과와
Flyway만으로 빈 MySQL DB에 전체 테이블을 생성하는 검증은 구분한다.