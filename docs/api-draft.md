# API 초안

실제 서비스 API: 미정.

공통 상태 페이지는 API를 직접 호출하지 않는다.

실제 조회 실패 화면에서는 onRetry로 조회 함수를 전달한다.
독립 /failure 화면의 재시도 버튼은 페이지를 새로고침한다.
## 인증 응답·예외 (백엔드 `auth/common`)

auth 컨트롤러는 `ApiResponse`로 응답하고, 실패는 `ApiException(ErrorCode)`를 던진다. 프론트 `src/auth/api/client.js`와 같은 형식이다. 예외 처리기는 `auth` 패키지에만 적용된다.

| 위치 | 역할 |
| --- | --- |
| `auth/common/ApiResponse` | `ApiResponse.ok(data)`, `ApiResponse.ok()`, `ApiResponse.fail(code, message, fieldErrors)` |
| `auth/common/ErrorCode` | 인증·회원 오류 코드·HTTP 상태·기본 문구 목록 |
| `auth/common/ApiException` | `throw new ApiException(ErrorCode.EMAIL_DUPLICATED, Map.of("email", "..."))` |
| `auth/common/AuthExceptionHandler` | auth 컨트롤러 단계 예외 → 실패 응답. `@Valid` 실패는 `INVALID_INPUT` + 항목별 `fieldErrors`, 예상 못 한 오류는 `INTERNAL_ERROR`(원인은 서버 로그에만) |

| 코드 | 상태 | 용도 |
| --- | --- | --- |
| `INVALID_INPUT` | 400 | 입력 검증 실패, 깨진 JSON, 필수 값 누락 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 없는 주소·데이터 |
| `METHOD_NOT_ALLOWED` | 405 | 요청 방식 불일치 |
| `INTERNAL_ERROR` | 500 | 예상하지 못한 오류 |
| `AUTH_REQUIRED` · `TOKEN_EXPIRED` · `TOKEN_INVALID` · `REFRESH_INVALID` · `LOGIN_FAILED` | 401 | 인증 |
| `LOGIN_ID_DUPLICATED` · `EMAIL_DUPLICATED` | 409 | 회원 중복 |
| `INVALID_IMAGE` | 400 | 프로필 이미지 형식·용량 |

## 공통 요청 클라이언트 (`src/auth/api/client.js`)

auth의 api 함수는 `client.get / post / patch / delete`를 거쳐 요청한다. 화면에서 `fetch`를 직접 쓰지 않는다.

| 항목 | 규칙 |
| --- | --- |
| 주소 | `/api/v1` + 내부 경로. `/`로 시작하지 않거나 외부 주소면 요청하지 않는다 |
| 성공 응답 | `{ success: true, data }` → `data`를 돌려준다 |
| 실패 응답 | `{ success: false, error: { code, message, fieldErrors? } }` → `ApiError(code, message, { status, fieldErrors })`를 던진다 |
| 인증 | 로그인 상태면 `Authorization: Bearer {accessToken}`을 붙인다 |
| 토큰 만료 | `TOKEN_EXPIRED`면 재발급 후 원래 요청을 한 번만 다시 보낸다 |
| 위조 토큰 | `TOKEN_INVALID`면 로그인 정보를 지운다 |
| 쿠키 | 같은 출처에만 보낸다 (`credentials: same-origin`) |
| 시간 초과 | 10초. `TIMEOUT` 오류 |
| 네트워크 오류 | `NETWORK_ERROR` 오류 |

재발급(`src/auth/api/tokenRefresh.js`): `POST /api/v1/auth/refresh`, refresh token은 HttpOnly 쿠키로 자동 전송.
응답 `{ accessToken, member }`. 동시에 여러 번 불려도 요청은 한 번만 보낸다. 실패하면 로그인 정보를 지운다.

## 인증 (`src/auth/api/authApi.js`)

현재 mock(300~800ms 지연, `// MOCK:` 주석). mock 여부는 `src/auth/api/mockConfig.js`의 `USE_MOCK` 하나로 auth의 api 파일이 함께 바꾼다. 함수 시그니처는 유지한다.
mock 가상 회원은 새로고침하면 초기화된다. 예시 데이터: 아이디 `demouser`, 이메일 `demo@example.com`.

| 함수 | 실제 API | 요청 | 응답 `data` | 실패 코드 |
| --- | --- | --- | --- | --- |
| `checkLoginId(loginId)` | `GET /auth/check-login-id?loginId=` | 아이디 | `{ available }` | `INVALID_INPUT` |
| `signup({ loginId, password, name, email })` | `POST /auth/signup` | 아래 입력 규칙 | `{ memberId, loginId, name, email }` | `INVALID_INPUT`, `LOGIN_ID_DUPLICATED`, `EMAIL_DUPLICATED` |
| `login({ loginId, password })` | `POST /auth/login` | 아이디·비밀번호 | `{ accessToken, member }` + refresh token 쿠키 | `INVALID_INPUT`, `LOGIN_FAILED` |
| `restoreSession()` | `POST /auth/refresh` | 없음 (refresh token 쿠키) | `{ accessToken, member }` → 스토어 저장 | 실패 = 로그아웃 상태로 시작 (정상). mock에서는 서버를 부르지 않는다 |
| `logout()` | `POST /auth/logout` | 없음 (refresh token 쿠키) | 없음 | 실패해도 화면의 로그인 상태는 지운다 |

- `member`: `{ memberId, loginId, name, email, nickname, profileImageUrl }`. 비밀번호는 어떤 응답에도 넣지 않는다.
- 앱 시작 시 `App.jsx`가 `restoreSession()`을 한 번 부르고, 끝나면 성공·실패와 무관하게 `initialized`를 표시한다.
- `login` 성공 시 스토어에 저장한다. 실패 메시지는 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않는다.
- 이메일은 소문자로 바꿔 비교·저장한다.

입력 규칙 (`src/auth/utils/authValidation.js`, 서버도 같은 규칙으로 다시 검사):

| 항목 | 규칙 |
| --- | --- |
| loginId | 4~20자, 영문 소문자·숫자 |
| password | 8~32자, 영문 소문자·대문자·숫자·특수문자 모두 포함, 공백·비영문 자판 문자 불가 |
| name | 1~50자, 문자 종류 제한 없음 |
| email | 이메일 형식, 최대 254자, 중복 불가 |

## 회원 (`src/auth/api/memberApi.js`)

로그인 필요(access token). 성공하면 스토어의 회원 정보도 갱신한다.

| 함수 | 실제 API | 요청 | 응답 `data` | 실패 코드 |
| --- | --- | --- | --- | --- |
| `updateNickname(nickname)` | `PATCH /members/me/nickname` | `{ nickname }` | `member` (새 `nickname`) | `AUTH_REQUIRED`, `INVALID_INPUT` |
| `updateProfileImage(file)` | `PATCH /members/me/profile-image` | `multipart/form-data`, 항목 이름 `image` | `member` (새 `profileImageUrl`) | `AUTH_REQUIRED`, `INVALID_IMAGE` |

닉네임 규칙 (`validateNickname`): 앞뒤 공백 제외 2~20자, 모든 언어의 글자·숫자·문장부호·기호·일반 공백 허용, 제어 문자·보이지 않는 문자 불가, 다른 회원과 중복 허용.

프로필 이미지 규칙 (`src/auth/utils/profileImage.js`의 `PROFILE_IMAGE_RULES`, 서버도 같은 규칙으로 다시 검사):

| 항목 | 규칙 |
| --- | --- |
| 형식 | JPG·PNG. 확장자·MIME뿐 아니라 파일 시작 바이트(시그니처)까지 확인하고, 선택한 형식과 실제 내용이 같아야 한다 |
| 용량 | 1바이트 이상, 4MB 이하 |
| 저장 | 서버 폴더에 저장하고 접근 주소를 `profileImageUrl`로 돌려준다 (mock은 브라우저 임시 주소, 새로고침하면 사라짐) |
| 업로드 준비 | 전송 전 `prepareProfileImage(file)`를 거친다. 지금은 그대로 보내고, 나중에 JPG 자동 변환을 이 함수 안에 추가한다 |
