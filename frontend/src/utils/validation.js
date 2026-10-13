// 입력 항목마다 전달받은 기준으로 문자열 검증
export function validateText(
    value,
    { required = false, minLength, maxLength } = {},
) {
    const text = typeof value === "string" ? value.trim() : "";

    if (required && !text) {
        return "필수 입력 항목입니다.";
    }

    // 선택 항목의 빈 값은 길이 검사에서 제외
    if (!text) {
        return "";
    }

    const length = Array.from(text).length;

    if (minLength !== undefined && length < minLength) {
        return `${minLength}자 이상 입력해주세요.`;
    }

    if (maxLength !== undefined && length > maxLength) {
        return `${maxLength}자 이하로 입력해주세요.`;
    }

    return "";
}
// ── 회원 입력 규칙 (화면과 서버가 같은 규칙으로 검사한다) ──

// 아이디: 4~20자, 영문 소문자와 숫자만 (대소문자 혼동으로 인한 중복 방지)
export function validateLoginId(value) {
    const text = typeof value === "string" ? value : "";

    if (!text) {
        return "아이디를 입력해주세요.";
    }

    if (!/^[a-z0-9]{4,20}$/.test(text)) {
        return "4~20자의 영문 소문자와 숫자만 사용할 수 있습니다.";
    }

    return "";
}

// 비밀번호: 8~32자, 영문 소문자·대문자·숫자·특수문자를 모두 포함
// 공백은 앞뒤 잘림 등으로 혼동이 생기므로 허용하지 않고, trim도 하지 않는다
export function validatePassword(value) {
    const text = typeof value === "string" ? value : "";

    if (!text) {
        return "비밀번호를 입력해주세요.";
    }

    if (text.length < 8 || text.length > 32) {
        return "비밀번호는 8~32자로 입력해주세요.";
    }

    // 공백·한글 등을 제외한 영문 자판 문자만 허용
    if (!/^[\x21-\x7E]+$/.test(text)) {
        return "비밀번호에는 공백이나 영문 자판 외 문자를 쓸 수 없습니다.";
    }

    // 빠진 조건을 모아 한 번에 안내
    const missing = [];
    if (!/[a-z]/.test(text)) missing.push("소문자");
    if (!/[A-Z]/.test(text)) missing.push("대문자");
    if (!/[0-9]/.test(text)) missing.push("숫자");
    if (!/[^A-Za-z0-9]/.test(text)) missing.push("특수문자");

    if (missing.length > 0) {
        return `${missing.join("·")}를 포함해주세요.`;
    }

    return "";
}

// 이름: 1~50자, 외국인 이름을 고려해 문자 종류 제한 없음
export function validateName(value) {
    return validateText(value, { required: true, maxLength: 50 });
}

// 이메일: 기본 형식(아이디@도메인.최상위)과 표준 최대 길이(254자) 확인
export function validateEmail(value) {
    const text = typeof value === "string" ? value.trim() : "";

    if (!text) {
        return "이메일을 입력해주세요.";
    }

    if (text.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
        return "올바른 이메일 형식으로 입력해주세요.";
    }

    return "";
}

// 닉네임: 앞뒤 공백을 뺀 2~20자, 다국어 사용자를 위해 문자 종류는 넓게 허용 (중복 허용)
// 허용: 모든 언어의 글자·결합 기호(\p{L}\p{M}), 숫자(\p{N}), 문장부호·기호(\p{P}\p{S}), 일반 공백
// 차단: 제어 문자·보이지 않는 문자(폭 없는 공백 등) — 같은 모양으로 다른 사람을 흉내 내는 것을 막기 위해
export function validateNickname(value) {
    const text = typeof value === "string" ? value.trim() : "";

    if (!text) {
        return "닉네임을 입력해주세요.";
    }

    const length = Array.from(text).length;
    if (length < 2 || length > 20) {
        return "닉네임은 2~20자로 입력해주세요.";
    }

    if (!/^[\p{L}\p{M}\p{N}\p{P}\p{S} ]+$/u.test(text)) {
        return "닉네임에 쓸 수 없는 문자가 있습니다.";
    }

    return "";
}
