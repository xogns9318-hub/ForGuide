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

// 닉네임 변경 (앞뒤 공백은 빼고 저장, 다른 회원과 중복 허용)
export async function updateNickname(nickname) {
    const member = await client.patch("/members/me/nickname", { nickname });

    useAuthStore.getState().setMember(member);
    return member;
}
