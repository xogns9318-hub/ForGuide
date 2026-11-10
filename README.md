# ForGuide

외국인과 내국인이 금융 상품, 취업 정보, 상담 기관 정보를 조회하고 비교할 수 있도록 돕는 서비스입니다.

## 구성

- `frontend/`: Vite + React 클라이언트
- `backend/`: Spring Boot API 서버
- `database/`: Elasticsearch Dockerfile과 데이터베이스 관련 파일
- `ai/`: 추천·전처리 코드
- `docs/`: API 초안, 모델 카드, 배포 및 운영 문서

## 로컬 실행 전 준비

다음 도구가 필요합니다.

- Node.js 및 npm
- JDK 17
- MySQL 접근 정보
- Docker Desktop (Redis 또는 Elasticsearch 사용 시)

비밀값은 저장소에 올리지 않습니다. 개인 DB 설정은 Git에서 제외된
`backend/src/main/resources/application-local.properties` 또는 환경변수로만 관리합니다.

백엔드 실행에는 `JWT_SECRET`이 필요합니다. Base64로 인코딩한 32바이트 이상의 값으로 설정해야 하며, 실제 값은 문서나 커밋에 넣지 않습니다.

## 1. 선택 서비스 실행

프로젝트 루트에서 Redis를 실행합니다.

```powershell
docker compose up -d redis
```

기관 Elasticsearch 검색을 함께 확인하려면 search 프로필을 사용합니다.

```powershell
docker compose --profile search up -d elasticsearch
```

Elasticsearch 상태는 다음 명령으로 확인할 수 있습니다.

```powershell
Invoke-WebRequest http://127.0.0.1:9200
```

## 2. 백엔드 실행

새 PowerShell 창에서 아래 명령을 실행합니다. 이 창은 서버가 실행되는 동안 유지합니다.

```powershell
cd D:\FinalProject\ForGuide\backend

$keyBytes = [byte[]]::new(32)
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($keyBytes)
$env:JWT_SECRET = [Convert]::ToBase64String($keyBytes)

.\gradlew.bat bootRun
```

위 키는 현재 PowerShell 창에서만 유지됩니다. 개인 개발 환경에서 반복 실행이 필요하면 팀 보안 규칙에 맞춰 사용자 환경변수로 별도 관리합니다. 서버가 정상 시작되면 다음 로그가 보입니다.

```text
Tomcat started on port 8080
```

DB 연결 값은 개인 환경에 맞게 제공해야 합니다. 저장소에 있는 예시·문서의 값이나 다른 팀원의 값을 복사하지 않습니다.

## 3. 프론트엔드 실행

별도의 터미널에서 실행합니다.

```powershell
cd D:\FinalProject\ForGuide\frontend
npm install
npm run dev
```

기본 주소는 `http://localhost:5173`입니다. 개발 서버는 `/api` 요청을 `http://localhost:8080` 백엔드로 전달합니다.

## 자주 발생하는 문제

### 로그인 요청이 502 Bad Gateway로 실패하는 경우

대부분 백엔드가 8080 포트에서 실행되지 않은 경우입니다.

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen
```

결과가 없으면 백엔드 PowerShell 창에서 `JWT_SECRET` 설정을 확인한 뒤 `.\gradlew.bat bootRun`을 다시 실행합니다. Vite만 실행되어 있어도 백엔드가 꺼져 있으면 로그인·토큰 갱신 요청은 502가 됩니다.

### Elasticsearch 연결 경고가 보이는 경우

Elasticsearch는 선택 기능입니다. 검색을 사용하려면 Docker Desktop을 실행한 뒤 다음 명령으로 컨테이너를 시작합니다.

```powershell
docker compose --profile search up -d elasticsearch
```

백엔드는 Elasticsearch 연결 실패를 경고로 남기고 다른 기능은 계속 제공합니다.

## 확인 명령

프론트엔드:

```powershell
cd D:\FinalProject\ForGuide\frontend
npm run format:check
npm run build
```

백엔드:

```powershell
cd D:\FinalProject\ForGuide\backend
.\gradlew.bat test
```

백엔드 테스트는 실행 중인 `bootRun` 프로세스가 Gradle 리소스를 점유하지 않는 상태에서 실행합니다. 테스트가 끝나면 필요할 때 다시 `.\gradlew.bat bootRun`으로 서버를 시작합니다.
