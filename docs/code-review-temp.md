# 코드 점검 (임시)

2026-10-26 점검. 코드 리뷰가 끝나면 이 파일은 지운다.

## 규칙 위반 (AGENTS.md 기준)

| # | 문제 | 위치 |
| --- | --- | --- |
| 1 | 화면 문구를 `t()` 없이 한국어로 직접 씀 (약 190곳) | Community.jsx 52, EmploymentResume.jsx 48, LoanResults.jsx 19, Consultation.jsx 16, Signup.jsx 12, LoanCalculator.jsx 10, Login.jsx 10, CommunityPostModal.jsx 7, ProfileEdit.jsx 6, MyPage.jsx 6 등 |
| 2 | `client.js`를 거치지 않고 `fetch` 직접 호출, 토큰도 직접 붙임 | `frontend/src/api/resumeApi.js:89` |
| 3 | 이력서 초안을 sessionStorage에 저장 (예외는 언어 설정뿐) | `frontend/src/utils/resumeDraftStorage.js` |

## 폴더 구조·파일 위치

### 프론트엔드

- 페이지와 컴포넌트 혼재: `auth/`만 `pages/`·`components/`·`api/`·`store/` 기능 폴더 구조, 나머지 화면은 `components/` 아래
- API 두 곳: `src/api/`, `src/auth/api/`
- 상태 저장소: `src/store/`는 비어 있음(`.gitkeep`), 실제는 `auth/store/`
- 스타일 위치: 모듈 CSS가 `styles/`(`headerModule.module.css`, `institutionResults.module.css`, `underConstruction.module.css`)와 컴포넌트 옆(`Modal/Modal.module.css`)에 섞임, `auth.css`는 `auth/` 안
- 스타일 이름: kebab(`job-listings.css`, `employment-resume.css`)과 camel(`monthlyPayment.css`, `selectBox.css`, `statusPage.css`) 혼재
- CSS 연결: `routes/AppRoutes.jsx:12`가 `home.css`를 불러옴(Home.jsx도 불러옴), ExampleBadge·FieldError가 `statusPage.css`를 빌려 씀, LoanCalculator가 `monthlyPayment.css` 사용

### 백엔드

- 예외 처리기 위치 제각각: `member/common/AuthExceptionHandler`, `community/exception/CommunityExceptionHandler`, `consultation/institution/controller/InstitutionExceptionHandler`
- 이미지 저장 3벌 중복: member·community·employment에 `*ImageStorage`·`*ImageProperties`·`*WebConfig`(또는 `*ImageConfig`), `common/image/`에는 검증기만
- `consultation/` 바로 아래 빈 controller·dto·mapper·service 패키지 (실제 코드는 `institution/`)
- `docs/backend-structure.md`는 calculator를 `recommend/loan/calculator/`로 적었으나 실제는 최상위 `calculator/`(비어 있음)
- 실제 파일이 있는 폴더에도 `.gitkeep`이 남음 (java 패키지·`resources/mapper/` 10곳 이상)
- Flyway V16·V17 설명이 둘 다 `seed_support_institutions`
- 테스트 실패: `CommunityServiceTest`의 본인 게시글 삭제 테스트 1개가 `Transaction synchronization is not active`로 실패 (추천 변경 없이도 실패)

### 문서

- DB 문서 두 곳: `database/README.md`, `docs/db/README.md`. `database/README.md`에 없는 파일 `V1__initialize_schema.sql`이 적혀 있음
- `Functional_Specification.md`만 루트에 있음
- 빈 폴더: `docs/api/`(`api-draft.md`는 `docs/`에), `docs/design/`

## 코드 안쪽 점검 (2026-10-26 오후)

### 고쳐야 할 것

| # | 문제 | 위치 | 근거 |
| --- | --- | --- | --- |
| A1 | 이력서 API에 예외 처리기가 없다. 서비스가 던지는 `ApiException`(없음·권한·사진 오류)이 공통 응답 대신 Spring 기본 500으로 나가고, 프론트는 `UNKNOWN_ERROR`로 받는다 | `employment/` (다른 기능은 `@RestControllerAdvice`가 패키지별로 있음) | 코드로 확인, 실행 검증은 안 함 |
| A2 | 로그인·회원가입·마이페이지·프로필 수정에 "예시 데이터" 배지가 항상 보인다. 실제 백엔드에 연결됐는데(`USE_MOCK = false`) 조건 없이 표시 | `auth/pages/*.jsx` (팀장 담당) | 코드 확인 |
| A3 | 업로드 폴더 기본값이 실행 위치 기준 상대 경로(`uploads/...`)이고 `.gitignore`에 없다. 저장소 루트에 이미 `uploads/`가 생겨 있어 사용자 사진이 커밋될 수 있다 | `application.properties`, `*ImageProperties` | 확인 |
| A4 | `CommunityServiceTest` 삭제 테스트 실패 원인: 트랜잭션 없이 `deletePost`를 불러 `registerSynchronization`이 예외를 던짐. 운영 코드는 `@Transactional`이라 정상이고 테스트만 고치면 됨 | `backend/src/test/.../CommunityServiceTest` | 확인 |

### 손보면 좋은 것

| # | 문제 | 위치 |
| --- | --- | --- |
| B1 | 업로드 크기 설정(파일 20MB, 요청 85MB)이 실제 허용 크기(4MB)보다 커서 큰 요청도 끝까지 받은 뒤 거절 | `application.properties` |
| B2 | 커뮤니티의 로그인 유도가 `navigate("/login")`만 해서 로그인 후 원래 글로 못 돌아온다(댓글 쪽은 `next`를 붙임) | `Community.jsx:466, 521, 530` |
| B3 | 인증 mock 코드가 남아 있다(`USE_MOCK = false`, "백엔드 연결 후 삭제" 주석) | `auth/api/*` (팀장 담당) |
| B4 | 쓰지 않는 파일·함수: `styles/header.css`(654줄, 어디서도 import 안 함), `components/Button/Button.jsx`, `communityApi.js`의 `getCommunityPosts` | |
| B5 | 상태 화면 확인용 경로(`/loading`, `/empty`, `/failure`, `/input-error`, `/example`, `/error`)가 공개 라우트로 남아 있다 | `AppRoutes.jsx:301~306` |
| B6 | 일자리 목록 자료는 실제 공식 기관 정보인데 `MOCK` 표기와 가짜 지연이 붙어 있고 예시 배지는 없다. 실제 자료면 표기 정리, 예시면 배지 필요 | `api/jobListingsApi.js` |
| B7 | Prettier가 적용되지 않은 프론트 파일 62개 (AGENTS: 처음 손댈 때 '포맷만' 커밋) | `frontend/src` |
| B8 | 테스트 공백: 이력서·도움 기관 백엔드 테스트 없음, 프론트 자동 테스트 없음 | |

### 확인했고 문제없음

- MyBatis에 `${}` 문자열 끼워 넣기 없음(SQL 주입 위험 없음), `dangerouslySetInnerHTML`·`innerHTML`·`console.log` 없음, 비밀값 하드코딩 없음
- 게시글·댓글 수정·삭제, 이력서 조회·삭제 모두 본인 확인(`memberId`)이 있음
- 이미지 저장 3곳 모두 경로 조작 방어(저장 폴더 밖 파일 차단)가 있음. 다만 코드가 거의 같은 세 벌
- 게시글 삭제 순서가 외래키 설정과 맞음(좋아요·댓글 먼저 삭제, 나머지는 `ON DELETE CASCADE`)
- git 작성자 기록은 병합 계정이 많이 찍혀 담당자 판단에는 쓰지 않았다

## 문제없음

- 금지 기술(axios, styled-components, TypeScript, UI 라이브러리) 없음, 패키지 허용 목록 안
- localStorage는 언어 설정만, 로그인 토큰은 메모리

## 다음 순서 (제안, 아직 결정·수정 안 함)

1. 팀 규칙 확정 (2026-10-26 보류: "점검만, 수정은 나중에")
   - 프론트 폴더: 기능 폴더(`auth/`·`recommend/`처럼, 추천) / 종류별 폴더
   - CSS: 공통은 `styles/common.css`, 기능 전용은 기능 폴더 안 `*.module.css`(추천) / 전부 `styles/`에 모으고 이름만 통일
   - 백엔드: 예외 처리기·이미지 저장을 `common/`으로 모음(추천) / 기능별로 두되 패키지 이름만 통일
   - 적용 방식: AGENTS.md에 규칙 추가 + 담당자별 수정 요청(추천) / 팀장이 한 브랜치에서 일괄 수정
2. 담당자별 수정 요청 목록 작성 (담당자는 팀장이 지정, git 작성자 기록은 병합 계정이라 부정확)
3. 팀장 담당 영역은 직접 수정
   - A2: 인증 화면의 "예시 데이터" 배지 제거
   - B3: 인증 mock 코드(`USE_MOCK`, mock 구현) 정리
   - A3: `.gitignore`에 `uploads/` 추가 (공용 파일이라 팀 공지 후)
