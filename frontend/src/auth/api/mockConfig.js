// MOCK: 모든 api 파일이 함께 쓰는 mock 설정
// 백엔드 API가 준비되면 USE_MOCK을 false로 바꾼다. 화면 코드와 api 함수 시그니처는 그대로다.
export const USE_MOCK = false;

// MOCK: 실제 네트워크처럼 300~800ms 지연
export function mockDelay() {
    const ms = 300 + Math.floor(Math.random() * 501);
    return new Promise((resolve) => setTimeout(resolve, ms));
}
