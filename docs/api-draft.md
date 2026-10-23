# API 초안

실제 서비스 API: 미정.

공통 상태 페이지는 API를 직접 호출하지 않는다.

실제 조회 실패 화면에서는 onRetry로 조회 함수를 전달한다.
독립 /failure 화면의 재시도 버튼은 페이지를 새로고침한다.

## 인증 응답·예외 (백엔드 `common/response`, `common/exception`)

회원(member) 컨트롤러는 `ApiResponse`로 응답하고, 실패는 `ApiException(ErrorCode)`를 던진다. 프론트 `src/api/client.js`와 같은 형식이다. 예외 처리기는 `member` 패키지에만 적용된다.

| 위치                                 | 역할                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common/response/ApiResponse`        | `ApiResponse.ok(data)`, `ApiResponse.ok()`, `ApiResponse.fail(code, message, fieldErrors)`                                                              |
| `common/exception/ErrorCode`         | 인증·회원 오류 코드·HTTP 상태·기본 문구 목록                                                                                                            |
| `common/exception/ApiException`      | `throw new ApiException(ErrorCode.EMAIL_DUPLICATED, Map.of("email", "..."))`                                                                            |
| `member/common/AuthExceptionHandler` | member 컨트롤러 단계 예외 → 실패 응답. `@Valid` 실패는 `INVALID_INPUT` + 항목별 `fieldErrors`, 예상 못 한 오류는 `INTERNAL_ERROR`(원인은 서버 로그에만) |

| 코드                                                                                     | 상태 | 용도                                    |
| ---------------------------------------------------------------------------------------- | ---- | --------------------------------------- |
| `INVALID_INPUT`                                                                          | 400  | 입력 검증 실패, 깨진 JSON, 필수 값 누락 |
| `FORBIDDEN`                                                                              | 403  | 권한 없음                               |
| `NOT_FOUND`                                                                              | 404  | 없는 주소·데이터                        |
| `METHOD_NOT_ALLOWED`                                                                     | 405  | 요청 방식 불일치                        |
| `INTERNAL_ERROR`                                                                         | 500  | 예상하지 못한 오류                      |
| `AUTH_REQUIRED` · `TOKEN_EXPIRED` · `TOKEN_INVALID` · `REFRESH_INVALID` · `LOGIN_FAILED` | 401  | 인증                                    |
| `LOGIN_ID_DUPLICATED` · `EMAIL_DUPLICATED`                                               | 409  | 회원 중복                               |
| `INVALID_IMAGE`                                                                          | 400  | 프로필 이미지 형식·용량                 |

## 인증 설정 (백엔드 `common/security`)

| 위치                                          | 역할                                                                                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `common/security/JwtProperties`               | `jwt.*` 설정값. 수명 기본값 access 30분, refresh 14일                                       |
| `common/security/JwtProvider`                 | access token 발급·검증. 만료 `TOKEN_EXPIRED`, 위조·형식 오류 `TOKEN_INVALID`                |
| `common/security/JwtAuthenticationFilter`     | `Authorization: Bearer {토큰}` 검증 → 컨트롤러에서 `@AuthenticationPrincipal Long memberId` |
| `common/security/JwtAuthenticationEntryPoint` | 잠긴 주소에 인증 없음 → 401 (`AUTH_REQUIRED`·`TOKEN_EXPIRED`·`TOKEN_INVALID`)               |
| `common/security/SecurityConfig`              | 세션 없음(STATELESS), BCrypt, 접근 규칙                                                     |

접근 규칙: **기본 잠금.** 공개할 주소만 열고 나머지는 모두 로그인이 필요하다(`anyRequest().authenticated()`).
현재 공개 주소: `/api/v1/auth/**`, 프로필·커뮤니티 이미지 조회(GET), 커뮤니티 게시글 조회(GET `/api/v1/community/posts/**`), 작성자 미리보기·작성 글 목록(GET `/api/v1/community/members/*/preview`, `/posts`).
토큰이 실려 오면 `@AuthenticationPrincipal Long memberId`로 회원 번호를 받는다(공개 주소에서 토큰이 없으면 `null`).
로그인 없이 써야 하는 새 API는 해당 담당자가 `common/security/SecurityConfig`의 "공개 주소" 구역에 한 줄 추가한다. 잊으면 401이 난다.

## 이력서 저장 API

모든 이력서 API는 로그인한 회원만 사용할 수 있으며, 서버는 토큰의 `memberId`로 본인 이력서만 조회·변경한다. 일반(`BASIC`)과 블라인드(`BLIND`) 양식은 회원별로 각각 한 건만 저장한다.

| HTTP | 주소 | 역할 |
| --- | --- | --- |
| POST | `/api/v1/employment/resumes` | 이력서와 선택 증명사진 저장 |
| GET | `/api/v1/employment/resumes` | 내 일반·블라인드 이력서 목록 조회 |
| GET | `/api/v1/employment/resumes/{resumeId}` | 내 이력서 한 건 조회 |
| GET | `/api/v1/employment/resumes/{resumeId}/photo` | 내 증명사진 파일 조회 |
| DELETE | `/api/v1/employment/resumes/{resumeId}/photo` | 내 증명사진 즉시 삭제 |
| DELETE | `/api/v1/employment/resumes/{resumeId}` | 내 이력서와 연결 사진 삭제 |

저장 요청은 `multipart/form-data`이며 `resumeType`, JSON 문자열 `resumeData`, 선택 `photo`를 받는다. 일반 이력서 사진은 JPG·PNG 등 공통 이미지 검사 규칙과 4MB 제한을 통과해야 하며, 블라인드 양식의 사진 업로드는 거부한다.

사진 삭제는 DB의 `photo_url` 연결을 먼저 제거하고 트랜잭션 커밋 뒤 실제 서버 파일을 삭제한다. 이력서 작성 중 텍스트와 활성 탭은 브라우저 세션에만 임시 보관하며, 로그아웃하면 삭제된다. 서버의 저장 버튼을 누른 이력서만 재로그인 뒤에도 유지된다.

```java
.requestMatchers(HttpMethod.GET, "/api/v1/기능주소/**").permitAll()
```

실행 전 준비: 비밀키는 저장소에 넣지 않는다. 각자 환경변수 `JWT_SECRET`(Base64, 32바이트 이상)을 설정해야 백엔드가 켜진다.

PowerShell에서 키 만들기:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

IntelliJ 실행 설정의 Environment variables에 `JWT_SECRET=만든값`을 넣는다. 없거나 짧으면 서버가 이유를 출력하고 시작하지 않는다.

## 공통 요청 클라이언트 (`src/api/client.js`)

auth의 api 함수는 `client.get / post / patch / delete`를 거쳐 요청한다. 화면에서 `fetch`를 직접 쓰지 않는다.

| 항목          | 규칙                                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 주소          | `/api/v1` + 내부 경로. `/`로 시작하지 않거나 외부 주소면 요청하지 않는다                                                            |
| 성공 응답     | `{ success: true, data }` → `data`를 돌려준다                                                                                       |
| 실패 응답     | `{ success: false, error: { code, message, fieldErrors? } }` → `ApiError(code, message, { status, fieldErrors })`를 던진다          |
| 인증          | 로그인 상태면 `Authorization: Bearer {accessToken}`을 붙인다                                                                        |
| 토큰 만료     | `TOKEN_EXPIRED`면 재발급 후 원래 요청을 한 번만 다시 보낸다. 재발급 결과가 비로그인(null)이면 다시 보내지 않고 `AUTH_REQUIRED` 오류 |
| 위조 토큰     | `TOKEN_INVALID`면 로그인 정보를 지운다                                                                                              |
| 쿠키          | 같은 출처에만 보낸다 (`credentials: same-origin`)                                                                                   |
| 시간 초과     | 10초. `TIMEOUT` 오류                                                                                                                |
| 네트워크 오류 | `NETWORK_ERROR` 오류                                                                                                                |

재발급(`src/api/tokenRefresh.js`): `POST /api/v1/auth/refresh`, refresh token은 HttpOnly 쿠키로 자동 전송.
응답은 세 가지다. 동시에 여러 번 불려도 요청은 한 번만 보낸다.

| 상황                             | 서버 응답                                                        | `refreshAccessToken()` 결과          |
| -------------------------------- | ---------------------------------------------------------------- | ------------------------------------ |
| 쿠키 정상                        | 200 `{ success: true, data: { accessToken, member } }` + 새 쿠키 | 새 access token, 스토어 저장         |
| 쿠키 없음 (처음 접속한 비로그인) | 200 `{ success: true }` (`data` 없음, 쿠키 변경 없음)            | `null`, 로그인 정보 지움 (오류 아님) |
| 쿠키 만료·위조·이미 사용됨       | 401 `REFRESH_INVALID`                                            | 오류, 로그인 정보 지움               |

## 인증 (`src/auth/api/authApi.js`)

현재 **실제 API 사용**(`USE_MOCK = false`). mock 코드(300~800ms 지연, `// MOCK:` 주석)는 백엔드 없이 화면만 볼 때를 위해 남겨 두었다. mock 여부는 `src/auth/api/mockConfig.js`의 `USE_MOCK` 하나로 auth의 api 파일이 함께 바꾼다. 함수 시그니처는 유지한다.
mock 가상 회원은 새로고침하면 초기화된다. 예시 데이터: 아이디 `demouser`, 이메일 `demo@example.com` (공용 DB에도 같은 데모 계정이 있다).

개발 실행: 프론트 `npm --prefix frontend run dev`(5173)가 `/api` 요청을 백엔드(8080)로 전달한다(`vite.config.js` 프록시). 백엔드는 환경변수 `JWT_SECRET`이 있어야 켜진다.

| 함수                                         | 실제 API                            | 요청                      | 응답 `data`                                                             | 실패 코드                                                                     |
| -------------------------------------------- | ----------------------------------- | ------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `checkLoginId(loginId)`                      | `GET /auth/check-login-id?loginId=` | 아이디                    | `{ available }`                                                         | `INVALID_INPUT`                                                               |
| `signup({ loginId, password, name, email })` | `POST /auth/signup`                 | 아래 입력 규칙            | `{ memberId, loginId, name, email }`                                    | `INVALID_INPUT`, `LOGIN_ID_DUPLICATED`, `EMAIL_DUPLICATED`                    |
| `login({ loginId, password })`               | `POST /auth/login`                  | 아이디·비밀번호           | `{ accessToken, member }` + refresh token 쿠키                          | `INVALID_INPUT`, `LOGIN_FAILED`                                               |
| `restoreSession()`                           | `POST /auth/refresh`                | 없음 (refresh token 쿠키) | `{ accessToken, member }` → 스토어 저장. 쿠키가 없으면 `data` 없음(200) | 쿠키 없음·실패 = 로그아웃 상태로 시작 (정상). mock에서는 서버를 부르지 않는다 |
| `logout()`                                   | `POST /auth/logout`                 | 없음 (refresh token 쿠키) | 없음                                                                    | 실패해도 화면의 로그인 상태는 지운다                                          |

- `member`: `{ memberId, loginId, name, email, nickname, profileImageUrl }`. 비밀번호는 어떤 응답에도 넣지 않는다.
- 백엔드 구현: `member/controller/AuthController`, `member/service/AuthService`, `member/mapper/`(SQL `resources/mapper/member/`). 회원가입 성공은 201.
- refresh token: 무작위 32바이트(쿠키 `refreshToken`, HttpOnly·SameSite=Strict·Path=/api/v1/auth·Max-Age 14일). DB `refresh_tokens.token`에는 SHA-256 해시만 저장. 재발급 시 교체하고, 같은 토큰은 한 번만 쓸 수 있다.
- 로그인: 없는 아이디도 비밀번호 비교 시간을 똑같이 써서 응답 시간으로 가입 여부를 알 수 없게 한다.
- 앱 시작 시 `App.jsx`가 `restoreSession()`을 한 번 부르고, 끝나면 성공·실패와 무관하게 `initialized`를 표시한다.
- `login` 성공 시 스토어에 저장한다. 실패 메시지는 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않는다.
- 이메일은 소문자로 바꿔 비교·저장한다.

입력 규칙 (`src/auth/utils/authValidation.js`, 서버도 같은 규칙으로 다시 검사):

| 항목     | 규칙                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| loginId  | 4~20자, 영문 소문자·숫자                                                       |
| password | 8~32자, 영문 소문자·대문자·숫자·특수문자 모두 포함, 공백·비영문 자판 문자 불가 |
| name     | 1~50자, 문자 종류 제한 없음                                                    |
| email    | 이메일 형식, 최대 254자, 중복 불가                                             |

## 회원 (`src/auth/api/memberApi.js`)

로그인 필요(access token). 성공하면 스토어의 회원 정보도 갱신한다. 백엔드: `member/controller/MemberController`, `member/service/MemberService`, `member/image/`(저장·삭제), `common/image/ImageFileValidator`(형식·용량·크기 검사). 회원 번호는 토큰에서만 꺼낸다.

| 함수                       | 실제 API                          | 요청                                     | 응답 `data`                     | 실패 코드                        |
| -------------------------- | --------------------------------- | ---------------------------------------- | ------------------------------- | -------------------------------- |
| `updateNickname(nickname)` | `PATCH /members/me/nickname`      | `{ nickname }`                           | `member` (새 `nickname`)        | `AUTH_REQUIRED`, `INVALID_INPUT` |
| `updateProfileImage(file)` | `PATCH /members/me/profile-image` | `multipart/form-data`, 항목 이름 `image` | `member` (새 `profileImageUrl`) | `AUTH_REQUIRED`, `INVALID_IMAGE` |

닉네임 규칙 (`validateNickname`): 앞뒤 공백 제외 2~20자, 모든 언어의 글자·숫자·문장부호·기호·일반 공백 허용, 제어 문자·보이지 않는 문자 불가, 다른 회원과 중복 허용.

프로필 이미지 규칙 (`src/auth/utils/profileImage.js`의 `PROFILE_IMAGE_RULES`, 서버도 같은 규칙으로 다시 검사):

| 항목           | 규칙                                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 형식           | JPG·PNG. 확장자·MIME뿐 아니라 파일 시작 바이트(시그니처)까지 확인하고, 선택한 형식과 실제 내용이 같아야 한다                                                                                   |
| 용량           | 1바이트 이상, 4MB 이하                                                                                                                                                                         |
| 저장           | 서버 폴더(`forguide.profile-image.dir`, 기본 `uploads/profile-images`, 환경변수 `PROFILE_IMAGE_DIR`)에 무작위 이름으로 저장. 새 이미지를 올리면 이전 파일은 지운다 (mock은 브라우저 임시 주소) |
| 주소           | `/api/v1/profile-images/{파일이름}`. **조회(GET)만 로그인 없이 공개**                                                                                                                          |
| 서버 추가 검사 | 실제로 이미지로 열리는지, 가로·세로 4096px 이하인지 (압축 폭탄 방지)                                                                                                                           |
| 업로드 준비    | 전송 전 `prepareProfileImage(file)`를 거친다. 지금은 그대로 보내고, 나중에 JPG 자동 변환을 이 함수 안에 추가한다                                                                               |

## 이력서 초안 mock (`src/api/resumeApi.js`)

서버 저장 전 화면 확인용 mock API다. 모든 함수는 500ms 지연 후 **브라우저 메모리**에만 초안을 보관한다.

| 함수                                      | 역할                                        | 반환                           |
| ----------------------------------------- | ------------------------------------------- | ------------------------------ |
| `saveResumeDraft({ resumeType, resume })` | 현재 기본/블라인드 이력서 초안 저장         | 저장한 초안                    |
| `getResumeDrafts()`                       | 현재 화면이 열린 동안 저장된 초안 목록 조회 | 기본·블라인드별 최신 초안 목록 |
| `getResumeDraft(resumeId)`                | 선택한 초안 한 건 조회                      | 해당 초안 또는 `undefined`     |

- 기본 이력서와 블라인드 채용 이력서는 각각 최신 초안 1개만 유지한다.
- 같은 양식을 다시 저장하면 기존 초안은 최신 내용으로 교체한다.
- 초안은 `localStorage`에 저장하지 않으므로 브라우저를 새로고침하면 사라진다.
- 사진은 현재 브라우저 미리보기 전용이라 저장·불러오기 대상에서 제외한다.
- 실제 서버 API 주소, DB 저장 방식과 사진 파일 영구 저장은 미정이다.

## 일자리 목록 mock (`src/api/jobListingsApi.js`)

서버 연동 전 화면 확인용 mock API다. 450ms 지연 후 외국인 취업 지원 사이트·기관 카드 구역을 반환한다.

| 함수                      | 역할                                                              | 반환             |
| ------------------------- | ----------------------------------------------------------------- | ---------------- |
| `getJobListingSections()` | 공공 취업·근로자 채용·유학생 취업·지역 상담 구역의 카드 목록 조회 | 구역과 카드 목록 |

- 카드 데이터에는 기관명, 한 줄 설명, 이용 대상, 지원 언어, 주요 기능, 공식 사이트 주소, 출처 URL과 확인일을 포함한다.
- 확인하지 못한 지원 언어·이용 조건은 `공식 사이트에서 확인` 또는 `센터별 확인 필요`로 표시한다.
- 전국 단위 카드와 지역별 카드는 `사이트 바로가기 ↗`를 통해 공식·전용 사이트를 새 탭으로 연다.
- 외부 링크에는 `target="_blank"`와 `rel="noopener noreferrer"`를 사용한다.
- 지역 선택 UI는 출처가 확인된 17개 시·도를 제공하며, 선택한 지역의 카드만 표시한다.
- `자세히 보기 ↗`는 공통 Modal을 열어 기관의 이용 상황, 이용 전 확인, 정보 출처와 확인일을 표시한다.
- 실제 공개 전에는 기관별 운영 여부와 지원 조건을 공식 사이트 기준으로 다시 확인한다.

## 커뮤니티 API

백엔드 위치:

- `community/controller/CommunityController.java`
- `community/service/CommunityService.java`
- `community/mapper/CommunityMapper.java`
- `resources/mapper/CommunityMapper.xml`
- `community/exception/CommunityExceptionHandler.java`

기본 주소: `/api/v1/community`

### `GET /api/v1/community/members/{memberId}/preview`

게시글·댓글 작성자 아바타와 `@로그인아이디` 멘션에 표시할 공개 프로필 요약을 조회한다. 로그인 없이 조회할 수 있으며, `memberId`, `loginId`, `nickname`, `profileImageUrl`, `postCount`, `receivedLikeCount`를 반환한다.

게시글 조회(GET)는 로그인 없이 가능하며, 작성(POST)과 삭제(DELETE)는 로그인해야 한다.

### 게시글 API

| 메서드 | 주소                        | 설명                                           |
| ------ | --------------------------- | ---------------------------------------------- |
| GET    | `/posts`                    | 게시글 전체 목록 조회                          |
| GET    | `/posts/{postId}`           | 게시글 상세 조회                               |
| GET    | `/posts/scroll`             | 커서 기반 게시글 목록 조회                     |
| GET    | `/my-reposts`               | 로그인 회원이 리포스트한 원본 게시글 목록 조회 |
| GET    | `/posts/popular?sort=likes` | 공감순 또는 조회순 인기 게시글 상위 10개 조회  |
| POST   | `/posts`                    | 게시글 작성                                    |
| PATCH  | `/posts/{postId}`           | 작성자 본인 게시글 본문·사진 수정              |
| DELETE | `/posts/{postId}`           | 작성자 본인 게시글 삭제                        |

### 무한 스크롤 조회

`GET /api/v1/community/posts/scroll`

요청 파라미터:

| 이름              | 필수 여부 | 설명                                                                                              |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------- |
| `cursorCreatedAt` | 선택      | 마지막으로 조회한 게시글의 작성 시간                                                              |
| `cursorPostId`    | 선택      | 마지막으로 조회한 게시글 번호                                                                     |
| `category`        | 선택      | `QUESTION_ANSWER`, `REVIEW_RECOMMEND`, `FREE_TALK` 중 하나. 선택하면 해당 카테고리만 조회         |
| `keyword`         | 선택      | 본문 내용 부분 일치 검색어 (최대 100자)                                                           |
| `topic`           | 선택      | `ACCOUNT`, `LOAN`, `INSURANCE`, `VISA_STAY`, `LIFE_TIP` 중 하나. 정해진 본문 키워드 묶음으로 조회 |
| `size`            | 필수      | 조회할 게시글 수 (1~50)                                                                           |

첫 페이지에서는 커서 두 개를 전달하지 않는다.

다음 페이지에서는 마지막 게시글의 `createdAt`과 `postId`를 전달한다.

정렬 기준:

1. `created_at DESC`
2. `post_id DESC`

### 인기 게시글 조회

`GET /api/v1/community/posts/popular`

오른쪽 인기 게시글 영역에서 사용한다. 로그인 없이 조회할 수 있으며, 서버는 최대 10개만 반환한다.

| 이름   | 필수 여부 | 기본값  | 설명                               |
| ------ | --------- | ------- | ---------------------------------- |
| `sort` | 선택      | `likes` | `likes`는 공감순, `views`는 조회순 |

정렬 기준:

- `sort=likes`: 공감 수 내림차순 → 조회 수 내림차순 → 최신 글 순
- `sort=views`: 조회 수 내림차순 → 공감 수 내림차순 → 최신 글 순
- 허용하지 않은 정렬값은 `INVALID_INPUT`(400)이다.
- 반환 항목에는 `likeCount`, `viewCount`, 게시글 정보, 첨부 사진 목록이 포함된다.

### 내 리포스트 목록 조회

`GET /api/v1/community/my-reposts`

로그인이 필요하다. 현재 회원이 리포스트한 원본 게시글을 **리포스트한 최신 순**으로 반환한다. 프론트의 `내 리포스트` 탭에서 사용하며, 리포스트를 취소하면 해당 카드는 목록에서 즉시 제거한다.

### 게시글 작성

`POST /api/v1/community/posts`

요청 형식: `multipart/form-data`

| 항목             | 필수 여부 | 설명                                                                                                                                                                                   |
| ---------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content`        | 필수      | 게시글 본문                                                                                                                                                                            |
| `category`       | 필수      | 질문·답변, 후기·추천, 자유 이야기 중 작성자가 선택한 카테고리                                                                                                                          |
| `relatedService` | 선택      | 후기·추천 글에서만 화면에 표시한다. `ACCOUNT_RECOMMEND`, `LOAN_RECOMMEND`, `INSURANCE_RECOMMEND`, `EMPLOYMENT_GUIDE` 중 하나를 선택하면 게시글에 내부 서비스 바로가기 링크를 표시한다. |
| `language`       | 필수      | 현재 서비스 언어                                                                                                                                                                       |
| `images`         | 선택      | 게시글 사진. 같은 이름으로 최대 4장 전송                                                                                                                                               |

사진 안내 문구와 서버 규칙은 동일하다: **JPG/PNG, 최대 4장, 파일당 20MB**.

입력 검증:

- `content`: 필수, 공백만 입력 불가, 최대 5000자
- `language`: 필수, 공백만 입력 불가
- `images`: JPG·PNG만 허용, 한 장당 20MB 이하, 최대 4장. 서버는 파일 시그니처와 실제 이미지 여부·가로세로 4096px 이하를 함께 확인한다.

사진은 서버 폴더(`forguide.community-image.dir`, 기본 `uploads/community-images`)에 무작위 이름으로 저장한다. 주소는 `/api/v1/community-images/{파일이름}`이며, 피드 표시를 위해 **조회(GET)만 로그인 없이 공개**한다.

게시글 작성자는 클라이언트 요청값이 아닌 로그인 인증 정보로 확인한다.

### 게시글 삭제

`DELETE /api/v1/community/posts/{postId}`

로그인한 작성자 본인만 삭제할 수 있다. 성공 시 응답 `data`는 없다. 게시글 DB 삭제 시 연결된 사진 행은 함께 삭제되며, 서버 폴더의 실제 사진 파일도 정리한다.

### 게시글 수정

`PATCH /api/v1/community/posts/{postId}`는 `multipart/form-data`로 받는다. 로그인한 게시글 작성자 본인만 수정할 수 있고, 다른 회원은 `FORBIDDEN`, 없는 게시글은 `NOT_FOUND`다.

| 항목             | 필수 여부 | 설명                                     |
| ---------------- | --------- | ---------------------------------------- |
| `content`        | 필수      | 공백 제외 최대 5,000자 본문              |
| `removeImageIds` | 선택      | 삭제할 기존 사진 번호. 여러 개 전달 가능 |
| `images`         | 선택      | 새로 추가할 JPG·PNG 사진                 |

기존 사진은 유지하거나 개별 삭제할 수 있고, 새 사진을 추가할 수 있다. 최종 사진 수는 최대 4장이고 새 사진 한 장은 20MB 이하여야 한다. 성공 시 수정된 게시글 전체를 반환한다.

### 댓글 API

| 메서드 | 주소                                   | 권한                           | 설명                                     |
| ------ | -------------------------------------- | ------------------------------ | ---------------------------------------- |
| GET    | `/posts/{postId}/comments`             | 공개                           | 게시글 댓글·답글을 작성 시간 순으로 조회 |
| POST   | `/posts/{postId}/comments`             | 로그인                         | 댓글 또는 답글 작성                      |
| PATCH  | `/posts/{postId}/comments/{commentId}` | 댓글 작성자                    | 댓글 본문 수정                           |
| DELETE | `/posts/{postId}/comments/{commentId}` | 댓글 작성자 또는 게시글 작성자 | 댓글 삭제                                |

댓글 본문은 공백만 입력할 수 없고 최대 1,000자다. POST 본문의 `parentCommentId`가 없으면 일반 댓글이고, 있으면 해당 댓글의 답글이다. 답글에는 `mentionLoginId`를 선택적으로 보낼 수 있으며 서버는 실제 회원의 로그인 아이디인지 확인한 뒤 태그 대상 회원 번호를 저장한다. 존재하지 않는 아이디면 `INVALID_INPUT`으로 저장하지 않는다. 답글에는 다시 `parentCommentId`를 넣어 계속 이어서 작성할 수 없다. 수정 API도 같은 검증 규칙을 사용한다. URL의 게시글과 실제 댓글의 게시글이 다르면 `NOT_FOUND`를 반환한다. 자식 답글이 있는 댓글을 삭제하면 본문만 삭제 표시로 바꿔 답글은 유지한다.

### 공통 응답 및 오류

성공 응답은 `ApiResponse.ok(data)` 형식을 사용한다.

실패 응답 예시:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "입력값이 올바르지 않습니다.",
    "fieldErrors": {}
  }
}
```

| HTTP 상태 | 오류 코드       | 설명                                       |
| --------- | --------------- | ------------------------------------------ |
| 400       | `INVALID_INPUT` | 필수값 누락, 길이 제한 위반, 잘못된 요청값 |
| 401       | `AUTH_REQUIRED` | 로그인하지 않은 사용자의 보호된 API 요청   |
| 403       | `FORBIDDEN`     | 다른 회원이 작성한 게시글 삭제 요청        |
| 404       | `NOT_FOUND`     | 없는 게시글 조회 또는 삭제 요청            |

커뮤니티의 요청 검증 예외는
`CommunityExceptionHandler`에서 공통 응답 형식으로 처리한다.

### 테스트 상태

- 프론트엔드 빌드: 성공
- 백엔드 Java 컴파일: 성공
- MyBatis 리소스 처리: 성공
- 실제 MySQL 연결 및 HTTP API 테스트: 대기

## 도움 기관 안내 선택 항목 — 화면 확인용

- 프론트 함수: `getConsultationOptions()`
- 원본 초안의 전체 분야·키워드·지역·언어·상담 방식 목록을 반환한다.
- 현재 mock JSON을 읽으며 500ms 지연을 적용한다.
- 반환 구조: `{ topics, regions, languages, methods }`
- 실제 서버 API 주소와 DB 구조는 미정이다.
- 안내받기는 선택 조건만 확인하며 기관 검색을 요청하지 않는다.
- `initialConsultationOptions`: 첫 화면에 바로 표시할 로컬 초안 목록.
- 초기 목록을 즉시 표시하고, 비동기 조회 결과로 목록을 갱신한다.

## 도움 기관 안내 — DB 기관 조회

선택 항목은 기존 로컬 초안 목록을 사용하고, 실제 기관 자료는 백엔드 API에서 조회한다.

| HTTP | 주소                                     | 역할                              |
| ---- | ---------------------------------------- | --------------------------------- |
| GET  | `/api/v1/consultation/institutions`      | 예시 기관을 제외한 기관 목록 조회 |
| GET  | `/api/v1/consultation/institutions/{id}` | 기관 상세 조회                    |

두 API는 로그인 없이 GET으로 조회할 수 있다.

| 프론트 함수                            | 역할                                            |
| -------------------------------------- | ----------------------------------------------- |
| `getConsultationInstitutions(filters)` | 서버 목록을 가져온 뒤 프론트에서 조건 검색·정렬 |
| `getConsultationInstitution(id)`       | 기관 상세 조회                                  |

- 검색 조건: 분야, 키워드, 검색어, 시·도, 시·군·구, 언어, 상담 방식.
- 목록 API에 검색 조건을 쿼리 파라미터로 보내지는 않는다.
- 최초 진입은 조건 없는 조회이며, 입력 조건이 바뀌면 이전 결과를 숨긴다.
- 안내받기를 누르면 확정 조건으로 다시 조회한다.
- 서버 연결 실패를 가짜 기관이나 빈 목록으로 대체하지 않는다.
- 확인되지 않은 이용 조건은 ‘확인 필요’로 표시한다.
