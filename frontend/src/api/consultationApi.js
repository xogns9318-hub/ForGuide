// 원본 초안의 전체 선택 목록을 가져온다.
import consultationOptions from "./consultationOptions.json";

// MOCK: 첫 화면에서 바로 표시할 선택 목록이다.
// 원본 데이터가 수정되지 않도록 복사해서 제공한다.
export const initialConsultationOptions = structuredClone(consultationOptions);

// 이후 실제 API로 연결해도 같은 호출 방식을 사용한다.
export async function getConsultationOptions() {
    // MOCK: 서버 요청처럼 비동기로 처리하는 흐름을 유지한다.
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 화면에서 사용할 별도 복사본을 반환한다.
    return structuredClone(consultationOptions);
}