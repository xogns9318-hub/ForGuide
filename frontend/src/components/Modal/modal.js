import { create } from "zustand";

// 공통 Modal 상태. 한 번에 하나의 창만 연다.
// 화면 코드는 confirm()·alert()만 부르고, 실제 창은 App의 <ModalHost />가 그린다.
let nextId = 1;

export const useModalStore = create((set, get) => ({
    // 열린 창 정보. null이면 닫힘
    // { id, type: "confirm" | "alert", message, title?, confirmText?, cancelText?, resolve, returnFocus }
    current: null,

    open: (modal) => {
        const previous = get().current;
        // 창을 연 버튼을 기억해 두었다가 닫을 때 포커스를 돌려준다
        // 창이 열린 채로 다른 창이 열리면, 처음 창을 연 버튼을 그대로 이어받는다
        const returnFocus = previous ? previous.returnFocus : document.activeElement;
        // 이미 열린 창이 있으면 앞의 창은 취소(false)로 끝낸다
        previous?.resolve(false);
        set({ current: { ...modal, id: nextId++, returnFocus } });
    },

    // 사용자가 고른 결과로 창을 닫는다 (확인 true / 취소·Esc·바깥 클릭 false)
    close: (result) => {
        const { current } = get();
        if (!current) return;
        set({ current: null });
        current.resolve(result);
        // 원래 누른 버튼이 아직 화면에 있으면 포커스를 돌려준다
        if (current.returnFocus?.isConnected) {
            current.returnFocus.focus();
        }
    },
}));

// window.confirm 대신 쓰는 확인창. 확인 → true, 취소·Esc·바깥 클릭 → false
// 사용: if (!(await confirm(t("community.comments.deleteConfirm")))) return;
// options: { title, confirmText, cancelText } (버튼 문구 기본값은 t("modal.confirm")·t("modal.cancel"))
export function confirm(message, options = {}) {
    return new Promise((resolve) => {
        useModalStore.getState().open({ ...options, type: "confirm", message, resolve });
    });
}

// window.alert 대신 쓰는 알림. 닫히면 끝난다 (돌려주는 값 없음)
// 사용: await alert("저장했어요.");
export function alert(message, options = {}) {
    return new Promise((resolve) => {
        useModalStore.getState().open({
            ...options,
            type: "alert",
            message,
            resolve: () => resolve(),
        });
    });
}
