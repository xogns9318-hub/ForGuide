import LoanCalculator from "../LoanCalculator/LoanCalculator.jsx";

// 월 상환액 페이지도 공통 계산 화면 사용
export default function MonthlyPayment() {
    // 공통 계산 화면을 월 상환액 페이지 모드로 연결
    return <LoanCalculator mode="monthly" />;
}