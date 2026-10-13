import { create } from "zustand";

// zustand : 로그인 상태 전역 저장소
// 주의!! persist(localStorage)를 쓰지 않는다. 새로고침하면 사라지고, 앱 시작 시 refresh token 쿠키로 다시 받아 오는 것으로 한다.
// refresh token은 HttpOnly 쿠키에만 있다. zustand에 두지 않는다.
const initialState = {
    // API 요청의 Authorization 헤더에 붙이는 토큰이다. 로그인한 사용자임을 증명한다.
    accessToken: null,

    // 로그인한 사용자의 정보. 
    member: null,

    // 앱 시작 시 로그인 복원 시도가 끝났는지 확인한다.
    // false인 동안은 로그인 여부를 판단하지 않는다. 복원 중 로그인 화면으로 튕기지 않게 하기 위함.
    initialized: false,
};

export const useAuthStore = create((set) => ({
    ...initialState,

    // 로그인·재발급 성공: 받은 토큰, 회원 정보 저장.
    setAuth: ({ accessToken, member }) => set({ accessToken, member }),

    // 닉네임·프로필 이미지 변경 등의 프로필 수정은 회원 정보만 갱신.
    setMember: (member) => set({ member }),

    // 로그아웃을 하면 토큰과 회원 정보를 삭제.
    clearAuth: () => set({ accessToken: null, member: null }),

    // 로그인 복원 시도 완료를 표시한다. 성공과 실패를 따지지 않는다.
    setInitialized: () => set({ initialized: true }),
}));
