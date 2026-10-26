import { Route } from "react-router-dom";
import AccountRecommend from "./pages/AccountRecommend.jsx";
import InsuranceRecommend from "./pages/InsuranceRecommend.jsx";
import LoanRecommend from "./pages/LoanRecommend.jsx";

export const recommendPaths = ["/service/account", "/service/insurance", "/service/loan"];

export function recommendRoutes() {
    return (
        <>
            <Route path="/service/account" element={<AccountRecommend />} />
            <Route path="/service/insurance" element={<InsuranceRecommend />} />
            <Route path="/service/loan" element={<LoanRecommend />} />
        </>
    );
}
