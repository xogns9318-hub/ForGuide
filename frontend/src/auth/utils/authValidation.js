import { msg } from "./authMessages.js";

// 회원 입력 규칙 (백엔드도 같은 규칙으로 다시 검사한다)
// 문제가 없으면 "", 있으면 번역 키로 된 메시지 { key, values }를 돌려준다 (화면에서 messageText로 번역)

const V = "auth.validation";

// 아이디: 4~20자, 영문 소문자와 숫자만 (대소문자 혼동으로 인한 중복 방지)
export function validateLoginId(value) {
    const text = typeof value === "string" ? value : "";

    if (!text) return msg(`${V}.loginIdRequired`);
    if (!/^[a-z0-9]{4,20}$/.test(text)) return msg(`${V}.loginIdFormat`);
    return "";
}

// 비밀번호: 8~32자, 영문 소문자·대문자·숫자·특수문자를 모두 포함
// 공백은 앞뒤 잘림 등으로 혼동이 생기므로 허용하지 않고, trim도 하지 않는다
export function validatePassword(value) {
    const text = typeof value === "string" ? value : "";

    if (!text) return msg(`${V}.passwordRequired`);
    if (text.length < 8 || text.length > 32) return msg(`${V}.passwordLength`);

    // 공백·한글 등을 제외한 영문 자판 문자만 허용
    if (!/^[\x21-\x7E]+$/.test(text)) return msg(`${V}.passwordCharacters`);

    // 빠진 조건을 모아 한 번에 안내 (항목 이름도 번역 키로 넘긴다)
    const missing = [];
    if (!/[a-z]/.test(text)) missing.push(`${V}.passwordParts.lower`);
    if (!/[A-Z]/.test(text)) missing.push(`${V}.passwordParts.upper`);
    if (!/[0-9]/.test(text)) missing.push(`${V}.passwordParts.digit`);
    if (!/[^A-Za-z0-9]/.test(text)) missing.push(`${V}.passwordParts.special`);

    if (missing.length > 0) return msg(`${V}.passwordMissing`, { itemKeys: missing });
    return "";
}

// 비밀번호 조건별 충족 여부 (회원가입 화면에서 입력하는 동안 바로 보여 준다)
// validatePassword와 같은 조건을 항목별로 나눈 것. key는 번역 키 끝부분
export function passwordChecks(value) {
    const text = typeof value === "string" ? value : "";

    return [
        { key: "length", met: text.length >= 8 && text.length <= 32 },
        { key: "lower", met: /[a-z]/.test(text) },
        { key: "upper", met: /[A-Z]/.test(text) },
        { key: "digit", met: /[0-9]/.test(text) },
        // 특수문자: 영문 자판의 기호만 센다 (한글 등은 특수문자가 아니라 쓸 수 없는 문자)
        { key: "special", met: /[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]/.test(text) },
    ];
}

// 비밀번호에 쓸 수 없는 문자(공백·한글 등 영문 자판 외)가 있는지 → 입력 중 바로 안내할 때 쓴다
export function hasInvalidPasswordChars(value) {
    const text = typeof value === "string" ? value : "";
    return text.length > 0 && !/^[\x21-\x7E]+$/.test(text);
}

// 이름(given name): 필수, 앞뒤 공백을 뺀 1~50자. 외국인 이름을 고려해 문자 종류 제한 없음
export function validateGivenName(value) {
    const text = typeof value === "string" ? value.trim() : "";

    if (!text) return msg(`${V}.givenNameRequired`);
    if (Array.from(text).length > 50) return msg(`${V}.nameLength`, { max: 50 });
    return "";
}

// 성(family name): 선택 (성이 없는 문화권 사용자를 위해 비워 둘 수 있음), 최대 50자
export function validateFamilyName(value) {
    const text = typeof value === "string" ? value.trim() : "";

    if (Array.from(text).length > 50) return msg(`${V}.nameLength`, { max: 50 });
    return "";
}

// 이메일 형식: 서버(@Email)가 막는 형식은 화면에서도 막는다
// (서버에서 막히면 서버의 한국어 문구가 그대로 보이므로, 화면이 같거나 더 엄격해야 한다)
// - 앞부분: 영문·숫자·허용 기호(!#$%&'*+/=?^_`{|}~-)·비영문 글자, 점은 사이에만 하나씩 (.a@ · a..b@ 불가)
//   쉼표·괄호·공백 등은 불가 (a,b@ 같은 오타를 바로 알려 준다), 최대 64자
// - 비영문 글자는 U+0080~U+FFFF까지 (이모지 같은 확장 문자는 서버가 막으므로 u 플래그로 코드 포인트 단위 검사)
// - 도메인: 점으로 나뉜 두 칸 이상, 각 칸은 63자 이하이고 영문·숫자·_·비영문 글자이고 하이픈은 가운데에만 (a@-x.com 불가)
const EMAIL_LOCAL_PART =
    /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~\u0080-\uFFFF-]+(\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~\u0080-\uFFFF-]+)*$/u;
const EMAIL_DOMAIN_LABEL = /^[A-Za-z0-9_\u0080-\uFFFF]+(-+[A-Za-z0-9_\u0080-\uFFFF]+)*$/u;

// 이메일: 위 형식과 표준 최대 길이(254자) 확인
export function validateEmail(value) {
    const text = typeof value === "string" ? value.trim() : "";

    if (!text) return msg(`${V}.emailRequired`);

    const at = text.lastIndexOf("@");
    const local = text.slice(0, at);
    const labels = text.slice(at + 1).split(".");

    const valid =
        text.length <= 254 &&
        at > 0 &&
        local.length <= 64 &&
        EMAIL_LOCAL_PART.test(local) &&
        labels.length >= 2 &&
        labels.every((label) => label.length <= 63 && EMAIL_DOMAIN_LABEL.test(label));

    if (!valid) return msg(`${V}.emailFormat`);
    return "";
}

// 닉네임: 앞뒤 공백을 뺀 2~20자, 다국어 사용자를 위해 문자 종류는 넓게 허용 (중복 허용)
// 허용: 모든 언어의 글자·결합 기호(\p{L}\p{M}), 숫자(\p{N}), 문장부호·기호(\p{P}\p{S}), 일반 공백
// 차단: 제어 문자·보이지 않는 문자(폭 없는 공백 등) — 같은 모양으로 다른 사람을 흉내 내는 것을 막기 위해
export function validateNickname(value) {
    const text = typeof value === "string" ? value.trim() : "";

    if (!text) return msg(`${V}.nicknameRequired`);

    const length = Array.from(text).length;
    if (length < 2 || length > 20) return msg(`${V}.nicknameLength`);

    if (!/^[\p{L}\p{M}\p{N}\p{P}\p{S} ]+$/u.test(text)) return msg(`${V}.nicknameCharacters`);
    return "";
}

// 이메일 인증 코드: 메일로 받은 6자리 숫자
export function validateVerificationCode(value) {
    const text = typeof value === "string" ? value.trim() : "";

    if (!text) return msg(`${V}.codeRequired`);
    if (!/^[0-9]{6}$/.test(text)) return msg(`${V}.codeFormat`);
    return "";
}
