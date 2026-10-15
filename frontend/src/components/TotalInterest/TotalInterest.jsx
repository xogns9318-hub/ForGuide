import LoanCalculator from "../LoanCalculator/LoanCalculator.jsx";

// 총 이자 페이지도 같은 입력·계산 결과·상환표를 사용
export default function TotalInterest() {
    // 공통 계산 화면을 총 이자 페이지 모드로 연결
    return <LoanCalculator mode="interest" />;
}