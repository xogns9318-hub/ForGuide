// 같은 api 폴더에 복사한 원본 초안의 전체 선택 목록 사용
import consultationOptions from "./consultationOptions.json";

// 화면에서 선택 목록을 가져오는 함수
// 이후 실제 서버 API로 연결해도 화면의 호출 방식은 유지
export async function getConsultationOptions() {
    // MOCK: 선택 목록을 기다리는 동안 로딩 표시를 확인하기 위한 지연
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 화면에서 원본 데이터를 변경하지 않도록 복사본 반환
    return structuredClone(consultationOptions);
}