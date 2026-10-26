import { msg } from "./authMessages.js";

// 프로필 이미지 규칙과 업로드 준비 (화면이 쓰는 규칙. 서버도 같은 규칙으로 다시 검사한다)
// 규칙을 바꿀 때는 이 파일의 PROFILE_IMAGE_RULES만 고친다. 서버(백엔드)도 같은 값으로 다시 검사한다.

export const PROFILE_IMAGE_RULES = {
    // 최대 용량 4MB
    maxBytes: 4 * 1024 * 1024,

    // 허용 형식: MIME 타입 → 파일 시작 바이트(시그니처)
    // 확장자·MIME은 파일 이름만 바꿔도 속일 수 있어서, 실제 파일 내용(시그니처)까지 확인한다
    formats: {
        "image/jpeg": { label: "JPG", signature: [0xff, 0xd8, 0xff] },
        "image/png": {
            label: "PNG",
            signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        },
    },
};

// 파일 선택창에서 고를 수 있는 형식 (<input accept>)
export const PROFILE_IMAGE_ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";

// 화면 안내 문구에 넣을 값 (예: formats "JPG·PNG", maxMb 4 → "JPG·PNG, 4MB 이하")
// 문구 자체는 번역 키 auth.profileImage.help 에 있다
export const PROFILE_IMAGE_HELP_VALUES = {
    formats: Object.values(PROFILE_IMAGE_RULES.formats)
        .map((format) => format.label)
        .join("·"),
    maxMb: PROFILE_IMAGE_RULES.maxBytes / 1024 / 1024,
};

const RULE_MESSAGE = msg("auth.profileImage.invalid", PROFILE_IMAGE_HELP_VALUES);

// 파일 앞부분을 읽어 실제 형식을 알아낸다 (모르는 형식이면 null)
async function detectImageType(file) {
    const longest = Math.max(
        ...Object.values(PROFILE_IMAGE_RULES.formats).map((f) => f.signature.length),
    );
    const head = new Uint8Array(await file.slice(0, longest).arrayBuffer());

    const match = Object.entries(PROFILE_IMAGE_RULES.formats).find(([, format]) =>
        format.signature.every((byte, index) => head[index] === byte),
    );
    return match ? match[0] : null;
}

// 프로필 이미지 검사 → 문제가 있으면 번역 키 메시지, 없으면 ""
export async function validateProfileImage(file) {
    if (!(file instanceof Blob)) {
        return msg("auth.profileImage.required");
    }

    if (file.size === 0) {
        return msg("auth.profileImage.empty");
    }

    if (file.size > PROFILE_IMAGE_RULES.maxBytes) {
        return RULE_MESSAGE;
    }

    // 선택한 형식(MIME)과 실제 내용이 모두 허용 형식이고 서로 같아야 한다
    // (예: PNG 내용에 .jpg 이름을 붙인 파일, 이미지가 아닌 파일에 .png 이름을 붙인 파일을 막는다)
    const detectedType = await detectImageType(file);
    if (!detectedType || file.type !== detectedType) {
        return RULE_MESSAGE;
    }

    return "";
}

// 업로드 직전 준비 단계: 검사를 통과한 파일을 서버로 보낼 형태로 만든다
// 지금은 그대로 돌려준다.
// 나중에 JPG 자동 변환·크기 줄이기를 추가할 때 이 함수 안에만 넣으면 된다
// (화면·api 코드는 이 함수의 결과만 쓰므로 고치지 않아도 된다).
export async function prepareProfileImage(file) {
    return file;
}
