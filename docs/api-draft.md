# API 초안

실제 서비스 API: 미정.

공통 상태 페이지는 API를 직접 호출하지 않는다.

실제 조회 실패 화면에서는 onRetry로 조회 함수를 전달한다.

## 인증 응답·예외 (백엔드 `common/response`, `common/exception`)

회원(member) 컨트롤러는 `ApiResponse`로 응답하고, 실패는 `ApiException(ErrorCode)`를 던진다. 프론트 `src/api/client.js`와 같은 형식이다. 예외 처리기는 `member` 패키지에만 적용된다.

| 위치                                 | 역할                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common/response/ApiResponse`        | `ApiResponse.ok(data)`, `ApiResponse.ok()`, `ApiResponse.fail(code, message, fieldErrors)`                                                              |
| `common/exception/ErrorCode`         | 인증·회원 오류 코드·HTTP 상태·기본 문구 목록                                                                                                            |
| `common/exception/ApiException`      | `throw new ApiException(ErrorCode.EMAIL_DUPLICATED, Map.of("email", "..."))`                                                                            |
| `common/exception/GlobalExceptionHandler` | 전체 컨트롤러 단계 예외 → 실패 응답. `@Valid` 실패는 `INVALID_INPUT` + 항목별 `fieldErrors`, 예상 못 한 오류는 `INTERNAL_ERROR`(원인은 서버 로그에만) |

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
| `common/security/JwtProvider`                 | access token 발급·검증(회원 번호 `sub`, 역할 `role`). 만료 `TOKEN_EXPIRED`, 위조·형식 오류 `TOKEN_INVALID` |
| `common/security/JwtAuthenticationFilter`     | `Authorization: Bearer {토큰}` 검증 → 컨트롤러에서 `@AuthenticationPrincipal Long memberId`, 권한 `ROLE_USER`·`ROLE_ADMIN` |
| `common/security/JwtAuthenticationEntryPoint` | 잠긴 주소에 인증 없음 → 401 (`AUTH_REQUIRED`·`TOKEN_EXPIRED`·`TOKEN_INVALID`), 권한 없음 → 403 (`FORBIDDEN`) |
| `common/security/SecurityConfig`              | 세션 없음(STATELESS), BCrypt, 접근 규칙                                                     |

접근 규칙: **기본 잠금.** 공개할 주소만 열고 나머지는 모두 로그인이 필요하다(`anyRequest().authenticated()`).
현재 공개 주소: `/api/v1/auth/**`, 프로필·커뮤니티 이미지 조회(GET), 커뮤니티 게시글 조회(GET `/api/v1/community/posts/**`), 커뮤니티 옵션 조회(GET `/api/v1/community/options/**`), 작성자 미리보기·작성 글 목록(GET `/api/v1/community/members/*/preview`, `/posts`).
토큰이 실려 오면 `@AuthenticationPrincipal Long memberId`로 회원 번호를 받는다(공개 주소에서 토큰이 없으면 `null`).
로그인 없이 써야 하는 새 API는 해당 담당자가 `common/security/SecurityConfig`의 "공개 주소" 구역에 한 줄 추가한다. 잊으면 401이 난다.

### 관리자 주소 (관리자 기능 담당자용)

- **주소 규칙:** 관리자 기능은 모두 `/api/v1/admin/` 아래에 만든다. 이 주소는 `SecurityConfig`가 이미 `ADMIN`만 통과시키므로 컨트롤러에서 권한을 다시 검사하지 않아도 된다. 토큰 없음 → 401 `AUTH_REQUIRED`, 일반 회원 → 403 `FORBIDDEN`.
- **백엔드에서 누구인지:** 다른 API와 같이 `@AuthenticationPrincipal Long memberId`. `/api/v1/admin/` 밖에서 관리자만 허용해야 하면 `SecurityConfig`에 `.hasRole(JwtProvider.ROLE_ADMIN)` 한 줄을 추가한다(회원 담당과 상의).
- **화면에서:** 로그인·재발급 응답과 스토어의 `member.role`이 `"ADMIN"`이면 관리자 메뉴를 보여 준다. 화면 숨김은 편의일 뿐이고 권한은 서버가 확인한다.
- **역할 저장:** `members.role`(`USER`/`ADMIN`, V32). 가입으로는 `USER`만 만들어진다. 역할은 access token에 들어가므로, DB에서 바꾸면 다시 로그인(또는 재발급)해야 반영된다.
- **관리자 계정 만들기:** 서버 시작 때 환경변수 `FORGUIDE_ADMIN_LOGIN_ID`·`FORGUIDE_ADMIN_PASSWORD`(선택 `FORGUIDE_ADMIN_EMAIL`)가 있고 그 아이디가 없으면 만든다(`member/service/AdminAccountInitializer`). 아이디·비밀번호는 가입 규칙을 따라야 하고, 같은 아이디의 일반 회원이 이미 있으면 관리자로 바꾸지 않는다. **비밀번호는 저장소·채팅에 남기지 말고 IntelliJ 실행 설정 환경변수에만 넣는다.**

## 이력서 저장 API

모든 이력서 API는 로그인한 회원만 사용할 수 있으며, 서버는 토큰의 `memberId`로 본인 이력서만 조회·변경한다. 일반(`BASIC`)과 블라인드(`BLIND`) 양식은 회원별로 각각 한 건만 저장한다.

| HTTP   | 주소                                          | 역할                              |
| ------ | --------------------------------------------- | --------------------------------- |
| POST   | `/api/v1/employment/resumes`                  | 이력서와 선택 증명사진 저장       |
| GET    | `/api/v1/employment/resumes`                  | 내 일반·블라인드 이력서 목록 조회 |
| GET    | `/api/v1/employment/resumes/{resumeId}`       | 내 이력서 한 건 조회              |
| GET    | `/api/v1/employment/resumes/{resumeId}/photo` | 내 증명사진 파일 조회             |
| DELETE | `/api/v1/employment/resumes/{resumeId}/photo` | 내 증명사진 즉시 삭제             |
| DELETE | `/api/v1/employment/resumes/{resumeId}`       | 내 이력서와 연결 사진 삭제        |

저장 요청은 `multipart/form-data`이며 `resumeType`, JSON 문자열 `resumeData`, 선택 `photo`를 받는다. 일반 이력서 사진은 JPG·PNG 등 공통 이미지 검사 규칙과 4MB 제한을 통과해야 하며, 블라인드 양식의 사진 업로드는 거부한다.

사진 삭제는 DB의 `photo_url` 연결을 먼저 제거하고 트랜잭션 커밋 뒤 실제 서버 파일을 삭제한다. 이력서 작성 중 텍스트와 활성 탭은 브라우저 세션에만 임시 보관하며, 로그아웃하면 삭제된다. 서버의 저장 버튼을 누른 이력서만 재로그인 뒤에도 유지된다.

## 콘텐츠 번역 API

고정 UI 문구는 프론트엔드 i18next가 처리한다. 아래 API는 게시글·댓글·이력서처럼 사용자가 작성한 원문을 번역할 때만 사용하며, 번역문이 원문을 덮어쓰지 않는다.

| HTTP | 주소 | 권한 | 역할 |
| --- | --- | --- | --- |
| POST | `/api/v1/community/posts/{postId}/translation` | 공개 | 게시글 원문을 대상 언어로 번역 |
| POST | `/api/v1/community/posts/{postId}/comments/{commentId}/translation` | 공개 | 댓글 원문을 대상 언어로 번역 |
| POST | `/api/v1/employment/resumes/translation` | 로그인 | 이력서의 서술형 입력값을 한국어 초안으로 번역 |

### 커뮤니티 번역 요청

게시글·댓글 원문과 원본 언어는 클라이언트가 보내지 않고 서버가 URL의 ID로 직접 조회한다. 요청에는 대상 언어만 보낸다.

```json
{
  "targetLanguage": "en"
}
```

응답은 번역문과 캐시·DB 재사용 여부를 반환한다.

```json
{
  "success": true,
  "data": {
    "translatedText": "Translated text",
    "cached": false
  }
}
```

지원 언어는 `ko`, `en`, `ja`, `zh`, `vi`, `th`다. 공개 커뮤니티 번역은 Redis → DB → Gemini 순서로 조회한다. DB의 `community_content_translations`가 번역문의 기준 저장소이고, Redis는 `translation:v2:{콘텐츠종류}:{ID}:v{내용버전}:{원문언어}:{대상언어}` 키로 7일간 보조 캐시한다.

같은 콘텐츠·원문 버전·대상 언어의 동시 번역 요청은 `community_translation_jobs`의 DB 잠금으로 하나만 Gemini를 호출한다. 나머지 요청은 저장 완료를 잠시 기다린 뒤 DB 번역문을 반환한다. Redis 연결이 끊겨도 캐시만 건너뛰고 DB·Gemini 흐름은 계속 진행한다.

게시글 또는 댓글을 수정·삭제하면 같은 트랜잭션에서 이전 DB 번역문을 제거하고, 커밋 뒤 Redis 캐시를 제거한다. 인기 게시글 영역은 현재 목록에 표시되는 인기글 전체를 선택 언어로 자동 번역하며, 일반 게시글 목록과 댓글은 사용자가 `번역 보기`를 눌렀을 때만 요청한다.

### 이력서 한국어 초안 요청

이력서는 개인정보가 포함될 수 있으므로 로그인한 본인만 요청할 수 있고 Redis 캐시·공개 번역 DB·번역 작업 잠금을 사용하지 않는다. 원문과 번역문은 이 API에서 저장하지 않으며, 사용자가 화면에서 검토·수정한 뒤 별도 이력서 저장 API를 호출한다.

```json
{
  "sourceLanguage": "auto",
  "targetLanguage": "ko",
  "sourceText": "Customer service and inventory management"
}
```

`sourceLanguage`은 `auto` 또는 지원 언어 코드이며, `sourceText`는 최대 5,000자다. 이름·연락처·날짜·회사명·학교명처럼 공식성이 중요한 값은 프론트엔드에서 한국어 초안 대상에서 제외한다.

```java
.requestMatchers(HttpMethod.GET, "/api/v1/기능주소/**").permitAll()
```

실행 전 준비: 비밀키는 저장소에 넣지 않는다. 각자 환경변수 `JWT_SECRET`(Base64, 32바이트 이상)을 설정해야 백엔드가 켜진다.

PowerShell에서 키 만들기:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

IntelliJ 실행 설정의 Environment variables에 `JWT_SECRET=만든값`을 넣는다. 없거나 짧으면 서버가 이유를 출력하고 시작하지 않는다.

## 추천 fast API

로그인 없이 쓴다. 입력은 쿼리 문자열이고, 미리 만든 `resources/recommend/*_fast.json`에서 결과를 찾아 `data`로 돌려준다(결과 모양은 `docs/model-card.md` "출력"). 모든 상품군에 `residence_status`(체류자격 8개 중 하나)가 필요하다.

| HTTP | 주소 | 입력 |
| --- | --- | --- |
| GET | `/api/v1/recommend/account/fast` | `purpose`(예금 / 적금), `term`(6 / 12 / 24 / 36), `visit`(상관없음 / 원치 않음), `institution`(은행 선호 / 상관없음) |
| GET | `/api/v1/recommend/insurance/fast` | `health_insurance`(예 / 아니오 / 모름), `sex`(남 / 여), `age`(19~99). 건강보험이 "예"가 아니면 `{ mode, redirect: "consultation" }` |
| GET | `/api/v1/recommend/loan/fast` | `purpose`(생활비 / 전세 보증금), `visit`(상관없음 / 원치 않음) |
| GET | `/api/v1/recommend/{account\|insurance\|loan}/choices` | 없음. 서빙 파일의 `key_order`·`choices`와 체류자격 목록 `residence_status`를 돌려준다. 화면은 선택지를 하드코딩하지 않고 이 값을 쓴다 (`getAccountChoices()`, `getInsuranceChoices()`, `getLoanChoices()`) |

프론트는 `src/recommend/api/recommendApi.js`의 `getAccountRecommendation(input)`·`getInsuranceRecommendation(input)`·`getLoanRecommendation(input)`으로 부른다(입력 객체를 그대로 쿼리로 보냄).

값이 틀리면 400 `INVALID_INPUT`, `fieldErrors`에 항목별 허용값(예: `"term": "허용값: 6, 12, 24"`). 계좌 관문의 "본인 명의 통장 아니오"는 API를 부르지 않고 화면에서 입출금통장 안내로 보낸다.

### 관리자 추천 사용 현황

`GET /api/v1/admin/recommendation-usage?days=30`

관리자 전용 API다. 추천 결과가 조회된 횟수와 보험 추천이 상담 안내로 전환된 횟수만 집계한다. 회원 번호·입력 조건·추천 결과 원문 등 개인정보는 저장하거나 반환하지 않는다.

| 이름 | 필수 여부 | 기본값 | 허용값 | 설명 |
| --- | --- | --- | --- | --- |
| `days` | 선택 | `30` | `7`, `30`, `90` | 오늘을 포함해 집계할 최근 일수 |

응답은 전체 요약과 날짜별 실행 수를 함께 반환한다. 날짜별 배열은 실행이 없는 날도 0으로 포함하므로 프론트의 추이 그래프가 끊기지 않는다.

```json
{
  "success": true,
  "data": {
    "periodDays": 30,
    "summary": {
      "totalUsageCount": 18,
      "loanUsageCount": 7,
      "insuranceUsageCount": 6,
      "accountUsageCount": 5,
      "productResultCount": 16,
      "consultationRedirectCount": 2,
      "latestUsedAt": "2026-11-03T10:20:00"
    },
    "dailyUsage": [
      {
        "usageDate": "2026-11-03",
        "totalUsageCount": 3,
        "loanUsageCount": 1,
        "insuranceUsageCount": 1,
        "accountUsageCount": 1
      }
    ]
  }
}
```

- 대출·계좌 추천 결과 조회는 `PRODUCT_RESULT`로 기록한다.
- 보험 추천은 상품 결과면 `PRODUCT_RESULT`, 상담 화면으로 안내하면 `CONSULTATION_REDIRECT`로 기록한다.
- 일반 사용자의 추천 API는 공개 상태를 유지하고, 현황 조회 API만 `/api/v1/admin/**` 권한 규칙으로 `ADMIN` 역할이 필요하다.
- 잘못된 `days`는 `INVALID_INPUT`(400)이다.

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

실제 API만 사용한다(mock 코드는 2026-10-26 삭제). 예시 데이터: 공용 DB의 데모 계정 아이디 `demouser`.

개발 실행: 프론트 `npm --prefix frontend run dev`(5173)가 `/api` 요청을 백엔드(8080)로 전달한다(`vite.config.js` 프록시). 백엔드는 환경변수 `JWT_SECRET`이 있어야 켜진다.

| 함수                                         | 실제 API                            | 요청                      | 응답 `data`                                                             | 실패 코드                                                                     |
| -------------------------------------------- | ----------------------------------- | ------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `checkLoginId(loginId)`                      | `GET /auth/check-login-id?loginId=` | 아이디                    | `{ available }`                                                         | `INVALID_INPUT`                                                               |
| `sendEmailCode({ email, purpose })` | `POST /auth/email/send-code` | 이메일, `purpose`(`SIGNUP`·`PASSWORD_RESET`·`FIND_ID`) | `{ expiresInSeconds, resendAfterSeconds }` | `INVALID_INPUT`, `EMAIL_DUPLICATED`(가입용), `VERIFICATION_RESEND_TOO_SOON`(429), `VERIFICATION_DAILY_LIMIT`(429), `MAIL_SEND_FAILED`(503) |
| `verifyEmailCode({ email, purpose, code })` | `POST /auth/email/verify` | 이메일, 목적, 6자리 코드 | `{ verificationToken }` | `INVALID_INPUT`, `VERIFICATION_CODE_INVALID`, `VERIFICATION_EXPIRED`, `VERIFICATION_ATTEMPTS_EXCEEDED` |
| `resetPassword({ email, verificationToken, newPassword })` | `POST /auth/password/reset` | 이메일, `PASSWORD_RESET` 인증 토큰, 새 비밀번호(가입 규칙) | `{ loginId }` | `INVALID_INPUT`, `EMAIL_NOT_VERIFIED` |
| `findLoginId({ email, verificationToken })` | `POST /auth/find-id` | 이메일, `FIND_ID` 인증 토큰 | `{ maskedLoginId }` (예: `demo***`) | `INVALID_INPUT`, `EMAIL_NOT_VERIFIED` |
| `signup({ loginId, password, givenName, familyName, nickname, email, emailVerificationToken })` | `POST /auth/signup`                 | 아래 입력 규칙 + 인증 완료 토큰 | `member`                                    | `INVALID_INPUT`, `LOGIN_ID_DUPLICATED`, `EMAIL_DUPLICATED`, `EMAIL_NOT_VERIFIED` |
| `login({ loginId, password })`               | `POST /auth/login`                  | 아이디·비밀번호           | `{ accessToken, member }` + refresh token 쿠키                          | `INVALID_INPUT`, `LOGIN_FAILED`, `LOGIN_LOCKED`(429) |
| `restoreSession()`                           | `POST /auth/refresh`                | 없음 (refresh token 쿠키) | `{ accessToken, member }` → 스토어 저장. 쿠키가 없으면 `data` 없음(200) | 쿠키 없음·실패 = 로그아웃 상태로 시작 (정상). mock에서는 서버를 부르지 않는다 |
| `logout()`                                   | `POST /auth/logout`                 | 없음 (refresh token 쿠키) | 없음                                                                    | 실패해도 화면의 로그인 상태는 지운다                                          |

- `member`: `{ memberId, loginId, name, givenName, familyName, email, nickname, profileImageUrl, role }`. `role`은 `USER`·`ADMIN`. `name`은 표시용 "이름 성"(성이 없으면 이름만), `familyName`은 없으면 `null`. 비밀번호는 어떤 응답에도 넣지 않는다.
- 백엔드 구현: `member/controller/AuthController`, `member/service/AuthService`, `member/mapper/`(SQL `resources/mapper/member/`). 회원가입 성공은 201.
- refresh token: 무작위 32바이트(쿠키 `refreshToken`, HttpOnly·SameSite=Strict·Path=/api/v1/auth·Max-Age 14일). DB `refresh_tokens.token`에는 SHA-256 해시만 저장. 재발급 시 교체하고, 같은 토큰은 한 번만 쓸 수 있다.
- 로그인: 없는 아이디도 비밀번호 비교 시간을 똑같이 써서 응답 시간으로 가입 여부를 알 수 없게 한다.
- 로그인 시도 제한(`member/service/LoginAttemptService`, 테이블 `login_attempts`): 같은 아이디로 연속 5번 실패하면 15분 잠금(5번째 실패부터 `LOGIN_LOCKED`), 잠긴 동안은 맞는 비밀번호도 거부. 성공하면 초기화, 마지막 실패 후 15분이 지나면 다시 센다. 없는 아이디도 똑같이 세어 잠김 여부로 가입 여부가 드러나지 않게 한다.
- 앱 시작 시 `App.jsx`가 `restoreSession()`을 한 번 부르고, 끝나면 성공·실패와 무관하게 `initialized`를 표시한다.
- `login` 성공 시 스토어에 저장한다. 실패 메시지는 아이디·비밀번호 중 무엇이 틀렸는지 구분하지 않는다.
- 이메일은 소문자로 바꿔 비교·저장한다.
- 이메일 인증(`member/controller/EmailVerificationController`, 테이블 `email_verifications`): 코드 6자리·10분 유효·5번 틀리면 무효, 다시 받기는 60초 간격·하루 10번. 확인하면 30분 동안 한 번만 쓸 수 있는 토큰을 준다. 코드·토큰은 SHA-256 해시만 저장. 가장 최근 코드만 유효.
- 비밀번호 찾기(`AuthService.resetPassword`): 가입되지 않은 이메일로 `PASSWORD_RESET` 코드를 요청해도 같은 응답을 주고 실제로는 보내지 않는다(재발송 간격·하루 한도도 같게 적용, 가입 여부가 드러나지 않게). 재설정하면 모든 기기의 refresh token을 지우고(새로 발급하지 않음) 로그인 잠금도 푼다. 응답의 `loginId`는 로그인 화면에 미리 채운다.
- 아이디 찾기(`AuthService.findLoginId`): 비밀번호 찾기와 같이 가입되지 않은 이메일에도 같은 응답(미발송). 아이디는 앞 4자(6자 이하면 앞 2자)만 보이고 뒤는 항상 `***`(길이도 비공개). 인증 용도가 달라(`FIND_ID`, V33) 아이디 찾기 토큰으로 비밀번호를 바꿀 수 없다.
- 화면의 이메일 인증 부분은 `src/auth/useEmailVerification.js`(상태·요청)와 `src/auth/components/EmailVerificationFields.jsx`(입력칸)를 회원가입·비밀번호 찾기가 같이 쓴다.
- 메일 발송: 환경변수 `FORGUIDE_MAIL_USERNAME`·`FORGUIDE_MAIL_PASSWORD`(Gmail 앱 비밀번호)가 있으면 Gmail SMTP로 보내고, 없으면 메일 대신 서버 로그에 코드를 남긴다(개발용, 시작 시 경고).

입력 규칙 (`src/auth/utils/authValidation.js`, 서버도 같은 규칙으로 다시 검사). 이름·성·닉네임 글자 수는 이모지도 한 글자로 센다(코드 포인트 기준):

| 항목     | 규칙                                                                           |
| -------- | ------------------------------------------------------------------------------ |
| loginId  | 4~20자, 영문 소문자·숫자                                                       |
| password | 8~32자, 영문 소문자·대문자·숫자·특수문자 모두 포함, 공백·비영문 자판 문자 불가 |
| givenName | 이름. 필수, 1~50자, 문자 종류 제한 없음 |
| familyName | 성. 선택(성이 없는 사용자는 비움), 최대 50자 |
| nickname | 필수, 2~20자, 다국어 글자·숫자·기호 허용, 보이지 않는 문자 불가, 중복 허용 |
| email    | 이메일 형식, 최대 254자, 중복 불가                                             |

## 회원 (`src/auth/api/memberApi.js`)

로그인 필요(access token). 성공하면 스토어의 회원 정보도 갱신한다. 백엔드: `member/controller/MemberController`, `member/service/MemberService`, `member/image/`(저장·삭제), `common/image/ImageFileValidator`(형식·용량·크기 검사). 회원 번호는 토큰에서만 꺼낸다.

| 함수                       | 실제 API                          | 요청                                     | 응답 `data`                     | 실패 코드                        |
| -------------------------- | --------------------------------- | ---------------------------------------- | ------------------------------- | -------------------------------- |
| `updateNickname(nickname)` | `PATCH /members/me/nickname`      | `{ nickname }`                           | `member` (새 `nickname`)        | `AUTH_REQUIRED`, `INVALID_INPUT` |
| `updateProfileImage(file)` | `PATCH /members/me/profile-image` | `multipart/form-data`, 항목 이름 `image` | `member` (새 `profileImageUrl`) | `AUTH_REQUIRED`, `INVALID_IMAGE` |
| `getProfile()` | `GET /members/me/profile` | 없음 | `{ language, residenceTypeCode, visaTypeCode, job, choices }` (저장한 적 없으면 값은 null) | `AUTH_REQUIRED` |
| `getFinance()` | `GET /members/me/finance` | 없음 | `{ annualIncome, employmentTypeCode, creditScoreBand, mainBank, existingLoanAmount, visaTypeCode, visaApplicable, choices }` (모르는 값 null) | `AUTH_REQUIRED` |
| `updateFinance({ annualIncome, employmentTypeCode, creditScoreBand, mainBank, existingLoanAmount, visaTypeCode })` | `PATCH /members/me/finance` | 모두 선택, 빈 값 = 모름(null), 금액은 원 | 조회와 같음 | `AUTH_REQUIRED`, `INVALID_INPUT`(선택지에 없는 값·음수·상한 초과) |
| `updateProfile({ language, residenceTypeCode, visaTypeCode, job })` | `PATCH /members/me/profile` | 사용 언어 필수, 나머지는 빈 값 = 모름(null) | 조회와 같음 | `AUTH_REQUIRED`, `INVALID_INPUT`(선택지에 없는 값) |
| `changePassword({ currentPassword, newPassword })` | `PATCH /members/me/password` | 현재·새 비밀번호 (새 비밀번호는 가입 규칙) | `{ accessToken, member }` + 새 refresh token 쿠키 → 스토어 저장 | `AUTH_REQUIRED`, `INVALID_INPUT`, `CURRENT_PASSWORD_INVALID`, `LOGIN_LOCKED`(429) |

프로필(`member_profiles`, 회원당 한 행): `choices`는 사용 언어 6개(화면 언어와 같음), 체류 유형 3개(`residence_types`), 체류자격 8개(`visa_types`, 추천 질문 목록과 같은 이름·순서)이며 선택지 값은 V27에서 넣는다. 체류 유형이 내국인(`KOREAN`)이면 체류자격은 저장하지 않는다. 사용 언어는 저장만 하고 화면 언어는 바꾸지 않는다.

내 금융 정보(`customer_finances`, 회원당 한 행): 금액(연 소득·기존 대출)은 원 단위이고 화면은 만원으로 입력받는다(상한 100억 원). 모르는 값은 null로 두고 0과 구분한다(화면 "확인 필요"). 신용점수 구간은 상세 추천과 같은 공시 8구간 코드(`GT900`·`801_900`…`LE300`, V34), 고용 형태는 `employment_types` 코드 8개(V34), 주거래은행은 계좌 추천 데이터(금융상품한눈에)의 기관 종류 "은행" 이름 + `OTHER`·`NONE`(화면 이름은 "(주)"를 떼고 가나다순). **체류자격(비자)은 프로필과 같은 값**이라 `member_profiles.visa_type_id` 하나에만 저장하고, 화면 이름은 두 곳 모두 "체류자격(비자)"이다. 내국인이면 `visaApplicable=false`로 숨기고 저장하지 않는다.

비밀번호 변경: 이 회원의 refresh token을 모두 지워 다른 기기의 로그인을 풀고, 이 기기에만 새로 발급한다(다른 기기의 access token은 만료될 때까지 최대 30분 남음). 현재 비밀번호를 틀린 횟수는 로그인 실패와 같이 센다. 백엔드: `MemberController` → `AuthService.changePassword`.

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
- `common/exception/GlobalExceptionHandler.java`

기본 주소: `/api/v1/community`

### `GET /api/v1/community/members/{memberId}/preview`

게시글·댓글 작성자 아바타와 `@로그인아이디` 멘션에 표시할 공개 프로필 요약을 조회한다. 로그인 없이 조회할 수 있으며, `memberId`, `loginId`, `nickname`, `profileImageUrl`, `postCount`, `receivedLikeCount`를 반환한다.

게시글 조회(GET)는 로그인 없이 가능하며, 작성(POST)과 삭제(DELETE)는 로그인해야 한다.

## 알림 API

알림은 커뮤니티 활동을 수신자별 DB에 먼저 저장한 뒤, DB 트랜잭션이 정상 커밋된 경우에만 SSE로 연결 중인 모든 브라우저 탭에 전달한다. 로그인한 회원만 사용할 수 있다. 이력서 저장·불러오기는 본인만 보는 작업이므로 알림함 대신 해당 화면의 성공 메시지를 사용한다.

| 메서드 | 주소 | 설명 |
| --- | --- | --- |
| GET | `/api/v1/notifications/stream` | SSE 실시간 알림 구독 |
| GET | `/api/v1/notifications` | 내 알림 목록을 커서 기반으로 조회 |
| GET | `/api/v1/notifications/unread-count` | 읽지 않은 알림 수 조회 |
| PATCH | `/api/v1/notifications/{notificationId}/read` | 내 알림 한 건 읽음 처리 |
| PATCH | `/api/v1/notifications/read-all` | 내 알림 전체 읽음 처리 |

목록 조회는 `cursorCreatedAt`, `cursorNotificationId`, `size`를 받으며 최신순으로 반환한다. SSE 이벤트 이름은 `notification`이고, 새 알림의 응답 객체를 전달한다. 액세스 토큰을 HTTP `Authorization` 헤더로 보내야 하므로 프론트는 `EventSource`가 아닌 `fetch` 스트리밍으로 연결한다.

알림 종류는 게시글 공감·공감 취소·리포스트·리포스트 취소, 새 댓글·답글·`@로그인아이디` 언급, 인기 게시글 순위다. 자기 행동에는 알림을 만들지 않는다. 대댓글과 언급이 같은 수신자에게 향하면 언급 알림만 생성한다. 인기 순위는 공감순·조회순 중 더 높은 순위를 기준으로 10위·3위·2위·1위에 진입했을 때 각각 한 번만 알리고, 하락 알림은 만들지 않는다.

### 게시글 API

| 메서드 | 주소                        | 설명                                           |
| ------ | --------------------------- | ---------------------------------------------- |
| GET    | `/posts`                    | 게시글 전체 목록 조회                          |
| GET    | `/posts/{postId}`           | 게시글 상세 조회                               |
| GET    | `/posts/scroll`             | 커서 기반 게시글 목록 조회                     |
| GET    | `/my-reposts`               | 로그인 회원이 리포스트한 원본 게시글 목록 조회 |
| GET    | `/posts/popular?sort=likes` | 공감순 또는 조회순 인기 게시글 상위 10개 조회  |
| GET    | `/options/categories` | 활성 카테고리 목록 조회 |
| GET    | `/options/topics` | 활성 주요 주제 목록 조회 |
| GET    | `/options/categories/{categoryCode}/related-services` | 선택한 카테고리의 활성 관련 서비스 목록 조회 |
| POST   | `/posts`                    | 게시글 작성                                    |
| PATCH  | `/posts/{postId}`           | 작성자 본인 게시글 본문·사진 수정              |
| DELETE | `/posts/{postId}`           | 작성자 본인 게시글 삭제                        |

### 커뮤니티 옵션 조회

카테고리·주제·관련 서비스의 실제 코드, 활성 여부, 표시 순서는 DB 옵션 테이블에서 관리한다. 화면에 보여 줄 문구는 DB의 `labelKey`를 i18next `t()`에 전달해 현재 선택 언어로 표시한다.

| API | 반환 데이터 |
| --- | --- |
| `GET /api/v1/community/options/categories` | 활성 카테고리 목록 |
| `GET /api/v1/community/options/topics` | 활성 주요 주제 목록 |
| `GET /api/v1/community/options/categories/{categoryCode}/related-services` | 해당 카테고리에 연결된 활성 관련 서비스 목록 |

각 목록 항목은 아래 구조를 반환한다.

```json
{
  "code": "REVIEW_RECOMMEND",
  "labelKey": "community.navigation.reviewRecommend",
  "displayOrder": 2
}
```

카테고리·관련 서비스·주제의 유효성 검증도 같은 DB 활성 옵션을 기준으로 수행한다. 따라서 옵션을 추가하거나 비활성화할 때 Java 하드코딩을 수정하거나 서버를 재배포할 필요가 없다.

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
`GlobalExceptionHandler`에서 공통 응답 형식으로 처리한다.

### 테스트 상태

- 프론트엔드 빌드: 성공
- 백엔드 Java 컴파일: 성공
- MyBatis 리소스 처리: 성공
- 실제 MySQL 연결 및 HTTP API 테스트: 대기

## 도움 기관 안내 선택 항목

- 프론트 함수: `getConsultationOptions()`
- 상담 분야 6개와 분야별 대표 키워드 3개씩 총 18개를 반환한다.
- 지역·언어·상담 방식 목록은 기존 값을 유지한다.
  - 로컬 선택 목록을 읽으며 기존 500ms 지연을 유지한다. 기관 검색과 상세 조회에는 실제 서버 API를 사용한다.
- 반환 구조: `{ topics, regions, languages, methods }`
- topics 항목: `{ code, name, keywords, rules }`
- rules는 대표 키워드를 기존 DB 업무의 분야 코드와 세부 키워드에 연결한다.
- `initialConsultationOptions`는 첫 화면에 바로 표시할 선택 목록이다.
  - 안내받기는 확정 조건으로 Elasticsearch 검색 API를 호출한다.

## 도움 기관 안내 — DB 기관 조회

	선택 항목은 로컬 목록을 사용하고, 기관 검색은 Elasticsearch API, 기관 상세는 기존 DB API에서 조회한다.

| HTTP | 주소                                     | 역할                              |
| ---- | ---------------------------------------- | --------------------------------- |
| GET  | `/api/v1/consultation/institutions`      | 예시 기관을 제외한 기관 목록 조회 |
| GET  | `/api/v1/consultation/institutions/{id}` | 기관 상세 조회                    |
| POST | `/api/v1/consultation/institutions/{id}/translation/{field}` | 기관 안내의 긴 설명 번역 |

두 API는 로그인 없이 GET으로 조회할 수 있다.

| 프론트 함수                            | 역할                                            |
| -------------------------------------- | ----------------------------------------------- |
| `getConsultationInstitutions(filters)` | Elasticsearch 검색 API 호출 및 화면 표시 형식 변환 |
| `getConsultationInstitution(id)`       | 기관 상세 조회                                  |

- 검색 조건: 분야, 키워드, 검색어, 시·도, 시·군·구, 언어, 상담 방식.
  - 검색 조건은 새 검색 API에 쿼리 파라미터로 전달하며, 기존 DB 목록·상세 API는 유지한다.
- 최초 진입은 조건 없는 조회이며, 입력 조건이 바뀌면 이전 결과를 숨긴다.
- 안내받기를 누르면 확정 조건으로 다시 조회한다.
- 서버 연결 실패를 가짜 기관이나 빈 목록으로 대체하지 않는다.
- 확인되지 않은 이용 조건은 ‘확인 필요’로 표시한다.
- 기관 목록·상세 응답에 guidance 객체를 추가한다.
- guidance 항목: location, methods, reservation, preparation, phoneLanguages, visitLanguages, phoneWeekend, phoneHoliday, visitWeekend, visitHoliday.
- guidance는 제공받은 기관 조사 원문의 조건부 설명을 전달한다.
- 번역 API의 field는 `description`, `target`, `notes`, `guidance`, `scope-notes`, `service-guide-{serviceId}`만 허용한다.
- 기관명·공식 주소·전화번호·URL·운영 시간처럼 사실 확인이 필요한 값은 번역하지 않고 원문을 유지한다.
- services.languages는 검색에 사용하는 확인된 방식별 지원 언어를 유지한다.
- 기본 6개 언어 외의 언어를 ‘다국어’로 묶는 처리는 카드 표시 단계에서만 수행한다.
- 검색어 조회에는 featuredKeywords도 포함한다.
- 화면의 6개 분야와 18개 대표 키워드는 기존 DB 업무의 분야·세부 키워드에 rules로 연결한다.
- 대표 키워드는 같은 상담 업무 안에서 분야와 세부 키워드가 모두 일치할 때만 인정한다.
- 대표 항목 하나의 내부 표현이 여러 개 일치해도 일치 개수는 한 번만 센다.
- 선택한 그룹에 없는 대표 키워드는 INVALID_INPUT으로 처리한다.
- getInstitutionGuide(institution)는 새 HTTP 요청 없이 기관 응답을 화면 표시용으로 변환하는 순수 함수다.
- 검색 화면과 같은 topics.rules로 대표 분야·키워드를 구성하며, 검색·정렬 함수의 동작은 바꾸지 않는다.
- 표시되는 전화·방문·언어·지역·온라인·예외 운영조건 및 출처가 같은 업무만 이용 안내를 묶는다.
- scopeNotes는 업무 요약(summary)과 상세 설명(description)을 상담 범위와 유의사항으로 표시한다.
- description은 줄바꿈별로 나누며, 빈 항목과 중복 문장은 제거한다.
- 소비자분쟁은 기존 생활·복지·법률 분야의 법률·주거분쟁 검색 규칙에 연결한다.
- getInstitutionGuide는 DB 원본을 수정하지 않으며 HTTP API의 응답 필드도 변경하지 않는다.

## 상담 준비 카드 한국어 번역

- 메서드: POST
- 주소: `/api/v1/consultation/preparation-card/translation`
- 인증: 로그인 없이 요청 가능
- 요청: `sourceText`에 사용자가 직접 작성한 상세 내용을 전달한다.
- 입력 제한: 공백만 있는 내용은 허용하지 않으며 최대 300자이다.
- 원문 언어는 자동 감지하고 대상 언어는 한국어로 고정한다.
- 이름·성·생년월일과 선택 항목은 이 API에 전달하지 않는다.
- 항목명과 선택 항목의 한국어 표시는 프론트엔드에서 처리한다.
- 성공 시 공통 응답의 data에 `translatedText`, `cached`를 반환한다.
- 상담 준비 카드 전용 `PreparationTranslationService`를 사용한다.
- 이 처리에서는 원문과 번역문을 DB·Redis 캐시에 저장하지 않는다.
- 번역 실패 시 실패 응답을 반환하며 원문을 번역 성공 결과로 대체하지 않는다.
- 프론트엔드 함수: translatePreparationDetails(sourceText)
- 공통 client를 통해 번역 API를 호출하고 translatedText를 반환한다.
- 화면에서는 번역 중 상태와 실패 시 재시도 버튼을 표시한다.
- 번역 중 입력 수정·페이지 이동으로 무효화된 응답은 화면에 반영하지 않는다.
- 상담 준비 카드 전용 번역 서비스에서 일시적인 HTTP 오류를 최대 두 번 추가 재시도한다.
- 재시도를 포함한 전체 처리 제한은 25초이며, 외부 요청 한 번은 남은 전체 제한 내에서 최대 25초이다.
- 사용량 제한과 키·권한 오류는 자동 재시도하지 않는다.
- 상담 번역의 프론트 대기 시간은 35초이며 다른 API의 기본 10초 제한은 유지한다.
- 실패 코드는 TRANSLATION_TIMEOUT, TRANSLATION_UNAVAILABLE, TRANSLATION_RATE_LIMITED로 구분한다.

## 내 문의 API

| Method | Path | 권한 | 설명 |
| --- | --- | --- | --- |
| GET | `/api/v1/inquiries` | 로그인 | 내 문의를 커서 기준 최신순으로 조회 |
| POST | `/api/v1/inquiries` | 로그인 | 문의와 JPG/PNG 첨부 이미지를 등록 |
| DELETE | `/api/v1/inquiries/{inquiryId}` | 해당 문의 작성자 | `RECEIVED` 상태인 답변 전 문의만 삭제. 첨부 이미지 DB 행은 함께 삭제되고, 서버 파일은 DB 커밋 후 정리 |
| POST | `/api/v1/inquiries/{inquiryId}/translation/{field}` | 해당 문의 작성자 | 제목·본문·답변(`title`, `content`, `answer`)을 화면에서만 번역 |
| POST | `/api/v1/admin/inquiries/{inquiryId}/translation/{field}` | 관리자 | 제목·본문·답변(`title`, `content`, `answer`)을 화면에서만 번역 |

답변 완료(`ANSWERED`) 문의는 문의 기록 보존을 위해 작성자 삭제를 허용하지 않는다. 문의 번역은 개인정보가 포함될 수 있어 DB·Redis에 저장하지 않는다.

## 문의 챗봇 API

- 주소: `/api/v1/chatbot/messages`, 모두 로그인 필요 (없으면 401 `AUTH_REQUIRED`)
- 프론트 함수: `src/api/chatbotApi.js` — `getChatbotMessages()`, `streamChatbotQuestion({ question, language, onStart, onDelta, signal })`(화면이 쓰는 이어서 받기), `sendChatbotQuestion({ question, language })`(한 번에 받기, 비상용), `clearChatbotMessages()`
- 백엔드: `chatbot/` (`ChatbotService`·`ChatbotContext`·`PiiMasker`), 키는 환경변수 `FORGUIDE_OPENAI_API_KEY`, 모델은 `FORGUIDE_OPENAI_MODEL`(기본 `gpt-5.6-luna`)

| 방식   | 요청                     | 성공 data                                                                                       |
| ------ | ------------------------ | ----------------------------------------------------------------------------------------------- |
| GET    | 없음                     | `available`, `dailyLimit`, `remainingToday`, `maxQuestionLength`, `messages[{ role, content }]` |
| POST   | `{ question, language }` | `question{ role, content }`(가린 질문), `answer{ role, content }`, `remainingToday`             |
| DELETE | 없음                     | 없음 (오늘 사용 횟수는 그대로)                                                                  |

- `role`은 `USER` / `ASSISTANT`. `messages`는 오래된 순, 최근 10개.
- 질문 답변은 서버가 최대 30초 기다리고, 프론트 대기 시간은 40초다.

**이어서 받기 (SSE)**: `POST /api/v1/chatbot/messages/stream`, 요청은 위 POST와 같다(`{ question, language }`).

- 화면은 `Accept: text/event-stream, application/json`으로 보낸다. 연결을 열기 전 오류(로그인·빈 질문·500자·하루 횟수·키 없음)는 아래 표의 JSON 오류로 온다.
- EventSource는 Authorization 헤더를 넣을 수 없어 `fetch` 스트림으로 읽는다(알림과 같은 방식).

| 이벤트  | data (JSON)                                                    | 뜻                         |
| ------- | -------------------------------------------------------------- | -------------------------- |
| `start` | `{ question: { role, content }, remainingToday }`              | 가린 질문과 차감 뒤 남은 횟수 |
| `delta` | `{ text }`                                                     | 답변 글자 조각 (공백 포함 그대로) |
| `done`  | `{ remainingToday }`                                           | 다 받음, 대화 기록에 저장됨 |
| `error` | `{ code, message }` (`CHATBOT_FAILED`)                          | 받던 중 실패               |

- 받던 중 OpenAI가 실패하거나, 연결이 `forguide.chatbot.stream-timeout`(기본 90초)을 넘기거나, 사용자가 화면을 떠나 연결을 끊으면 서버는 OpenAI 호출을 멈추고 횟수와 질문을 되돌린다. 받다 만 답변은 기록에 남지 않는다.
- 화면은 40초 동안 새 글자가 없거나, `done`·`error` 없이 연결이 닫히면 끊긴 것으로 본다(`CHATBOT_INTERRUPTED`, 화면 전용 코드).

| 코드                        | 상태 | 용도                                  |
| --------------------------- | ---- | ------------------------------------- |
| `INVALID_INPUT`             | 400  | 빈 질문                               |
| `CHATBOT_QUESTION_TOO_LONG` | 400  | 500자 초과                            |
| `CHATBOT_DAILY_LIMIT`       | 429  | 하루 30회 초과                        |
| `CHATBOT_UNAVAILABLE`       | 503  | 서버에 키 없음                        |
| `CHATBOT_FAILED`            | 502  | OpenAI 응답 실패 (횟수·질문은 되돌림) |

# 커뮤니티 신고 증빙 이미지 API

- `POST /api/v1/community/posts/{postId}/reports`
  - 로그인 회원이 게시글을 신고한다.
  - `multipart/form-data`로 `reportReason`과 선택 `images`를 전송한다.
  - `images`는 JPG/PNG, 최대 4장, 장당 20MB다.
- `POST /api/v1/community/posts/{postId}/comments/{commentId}/reports`
  - 댓글 신고의 동일한 형식이다.
- `GET /api/v1/community/reports/{reportId}/images`
  - 신고 작성자 본인만 자신의 증빙 이미지 목록을 조회한다.
- `GET /api/v1/community/reports/{reportId}/images/{reportImageId}`
  - 신고 작성자 본인만 증빙 이미지 파일을 조회한다.
- `GET /api/v1/admin/community/reports/{reportId}/images`
  - 관리자만 신고 증빙 이미지 목록을 조회한다.
- `GET /api/v1/admin/community/reports/{reportId}/images/{reportImageId}`
  - 관리자만 신고 증빙 이미지 파일을 조회한다.

## 도움 기관 안내 — Elasticsearch 검색

- 메서드: GET
- 주소: `/api/v1/consultation/institutions/search`
- 인증: 로그인 없이 요청 가능
- 선택 조건: query, topic, keywords, province, district, language, method.
- keywords는 같은 이름의 쿼리 파라미터를 반복해서 전달한다.
- 검색어는 최대 100자, 선택 키워드는 중복 제거 후 최대 50개다.
- 성공 시 공통 응답의 data에 `{ items, filters }`를 반환한다.
- items 항목은 `{ institution, preview, match }` 구조다.
- institution은 기관 원문, preview는 조건에 맞는 대표 상담 업무다.
- match는 role, keywords, selectedCount, percent, unknown을 포함한다.
- percent는 선택 키워드 일치율이며 지원 자격이나 승인 확률이 아니다.
- 검색어·분야·키워드·이용 조건은 같은 상담 업무를 기준으로 확인한다.
- 전화·방문 등 상담 방식별 언어와 지역 정보를 혼합하지 않는다.
- 직접 상담 → 키워드 일치 개수 → 미확인 조건 수 → 기관 ID 순으로 정렬한다.
- 정상적인 검색 결과 0건은 성공 응답의 빈 items로 반환한다.
- 검색 기능 비활성화 또는 검색 서비스 장애는 503 INSTITUTION_SEARCH_UNAVAILABLE로 반환한다.
- 잘못된 입력은 400 INVALID_INPUT으로 반환한다.
- 기존 DB 기관 목록·상세 API는 유지한다.
  - 프론트 getConsultationInstitutions(filters)는 새 검색 API를 호출하고 기관·대표 업무를 화면 표시 형식으로 변환한다.