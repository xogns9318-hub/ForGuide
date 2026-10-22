# ForGuide DB 변경 이력

## 1. 기록 기준

- DB 생성·계정 설정·테이블 변경 작업을 기록한다.
- 본인 작업과 팀원 작업을 작업자 항목으로 구분한다.
- 실제 실행 여부가 불분명하면 `확인 필요`로 기록한다.
- 작업 날짜는 실제 날짜를 확인한 뒤 작성한다.
- 문서에 SQL을 작성하는 것과 DB에 실행하는 것은 구분한다.
- 실행 SQL 파일이 있으면 파일명과 위치를 함께 기록한다.

## 2. 기존 작업 정리

### 2.1. 공용 DB 생성

- 작업일: 확인 필요
- 작업자: 유성철
- 서버: 공용 PC의 MySQL 서버
- DB 이름: forguide
- 작업 내용: 팀에서 사용할 공용 DB 생성
- 상태: 생성하여 사용 중

### 2.2. 공용 DB 접속 계정 설정

- 작업일: 확인 필요
- 작업자: 유성철
- 계정: forguide_user
- 작업 내용: 백엔드와 팀원들이 사용할 공용 DB 접속 계정 설정
- 상태: 프로젝트 연결 설정에 반영됨
- 확인할 사항: 계정의 접속 허용 범위와 실제 권한

### 2.3. 백엔드와 공용 DB 연결 설정

- 작업일: 확인 필요
- 작업자: 유성철
- 대상 DB: forguide
- 관련 파일: backend/src/main/resources/application.properties
- 작업 내용:
  - MySQL 연결 주소와 접속 계정 설정
  - MyBatis 설정
  - Flyway 활성화와 마이그레이션 경로 설정
- 상태: 설정 반영 완료

### 2.4. members 테이블 변경

- 작업일: 확인 필요
- 작업자: 유성철
- 대상 DB: forguide
- 대상 테이블: members
- 변경하려던 내용:
  - phone 컬럼 삭제
  - email 컬럼에 NOT NULL 적용
  - email 컬럼에 UNIQUE 제약조건 추가
- 실행 및 최종 적용 상태: 실제 테이블 구조 확인 필요
- 관련 Flyway 파일: 현재 저장소에서 확인되지 않음

당시 논의한 SQL:

```sql
ALTER TABLE members
    DROP COLUMN phone,
    MODIFY COLUMN email VARCHAR(255) NOT NULL COMMENT '이메일',
    ADD CONSTRAINT uq_members_email UNIQUE (email);
```

위 SQL은 당시 변경 내용을 기록한 것이다.
이미 적용되어 있을 수 있으므로 확인 없이 다시 실행하지 않는다.

확인 SQL:

```sql
SHOW CREATE TABLE forguide.members;
SHOW INDEX FROM forguide.members;
```

### 2.5. refresh_tokens 테이블 생성

- 작업일: 확인 필요
- 작업자: 신수연
- 대상 DB: 생성 위치 확인 필요
- 대상 테이블: refresh_tokens
- 작업 내용: 로그인 유지와 토큰 재발급을 관리할 테이블 생성
- 상태: 팀원에게 생성 완료 내용을 공유받음
- 상세 컬럼·제약조건: 확인 필요
- 생성 SQL 파일: 담당 팀원에게 확인 필요
- 관련 Flyway 파일: 확인 필요

확인할 사항:

- 실제 생성된 DB 이름
- 컬럼명과 자료형
- 기본키와 UNIQUE 제약조건
- members 테이블과의 외래키 관계
- 만료 시각 저장 방식
- 마이그레이션 파일 반영 여부

### 2.6. 검증용 DB와 접속 계정 준비

- 작업일: 확인 필요
- 작업자: 유성철
- 대상 서버: 공용 PC의 MySQL 서버
- DB 이름: forguide_verify
- 계정: forguide_verify_user
- 목적: 공용 DB와 분리하여 DB 변경 SQL 검증
- DB 생성 및 접속 확인 상태: 확인 필요
- 계정 권한 확인 상태: 확인 필요

확인 SQL:

```sql
SHOW DATABASES LIKE 'forguide_verify';
SHOW TABLES FROM forguide_verify;
```

검증 계정으로 접속한 뒤 권한 확인:

```sql
SHOW GRANTS;
```

### 2.7. 검증용 백엔드 프로필 추가

- 작업일: 확인 필요
- 작업자: 검증용 설정 작성자 이름 작성
- 관련 파일: backend/src/main/resources/application-verify.properties
- 작업 내용:
  - forguide_verify 연결 주소 설정
  - forguide_verify_user 계정 설정
  - verify 프로필로 검증용 연결을 선택하도록 구성
- 상태: 설정 파일 추가 완료
- 실제 연결 및 마이그레이션 검증: 별도 확인 필요

실행 방법:

```powershell
.\backend\gradlew.bat -p .\backend bootRun --args="--spring.profiles.active=verify"
```

## 3. 앞으로 사용할 기록 양식

새 작업이 생기면 아래 양식을 복사해서 추가한다.

### 작업명

- 작업일:
- 작업자:
- 대상 서버·DB:
- 대상 테이블:
- 변경 목적:
- 변경 내용:
- 실행 SQL 또는 마이그레이션 파일:
- 실행 결과:
- 확인 방법과 확인 결과:
- 남은 작업: