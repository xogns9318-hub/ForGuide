import { client } from "../../api/client.js";
import { useAuthStore } from "../store/useAuthStore.js";

// ── 회원 정보 변경 API (로그인 필요, 화면은 이 함수들만 쓴다) ──
// 응답 member: { memberId, loginId, name, email, nickname, profileImageUrl } (비밀번호 없음)
// 변경에 성공하면 스토어의 회원 정보도 함께 갱신한다 (다시 불러오지 않아도 화면에 바로 반영)

// 프로필 이미지 변경
// file: prepareProfileImage()를 거친 파일. 서버로는 multipart/form-data의 "image" 항목으로 보낸다
export async function updateProfileImage(file) {
    const formData = new FormData();
    formData.append("image", file);
    const member = await client.patch("/members/me/profile-image", formData);

    useAuthStore.getState().setMember(member);
    return member;
}

// 비밀번호 변경 → { accessToken, member }
// 다른 기기의 로그인은 풀리고, 이 기기는 서버가 새 refresh token 쿠키를 내려줘 로그인이 유지된다
// 새 access token으로 스토어를 바꿔 둔다
export async function changePassword({ currentPassword, newPassword }) {
    const data = await client.patch("/members/me/password", { currentPassword, newPassword });

    useAuthStore.getState().setAuth({ accessToken: data.accessToken, member: data.member });
    return data;
}

// 프로필 조회 → { language, residenceTypeCode, visaTypeCode, job, choices }
// 아직 저장한 적 없으면 값은 모두 null. choices: { languages, residenceTypes: [{ code, name }], visaTypes: [{ code, name }] }
export async function getProfile() {
    return client.get("/members/me/profile");
}

// 프로필 저장 (처음이면 새로 만든다) → 조회와 같은 모양
// 모르는 값은 빈 문자열로 보내면 서버가 null(모름)로 저장한다. 내국인(KOREAN)은 체류자격을 저장하지 않는다
export async function updateProfile({ language, residenceTypeCode, visaTypeCode, job }) {
    return client.patch("/members/me/profile", { language, residenceTypeCode, visaTypeCode, job });
}

// 닉네임 변경 (앞뒤 공백은 빼고 저장, 다른 회원과 중복 허용)
export async function updateNickname(nickname) {
    const member = await client.patch("/members/me/nickname", { nickname });

    useAuthStore.getState().setMember(member);
    return member;
}
