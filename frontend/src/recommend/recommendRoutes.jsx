import { Route } from "react-router-dom";
import AccountRecommend from "./pages/AccountRecommend.jsx";

export const recommendPaths = ["/service/account"];

export function recommendRoutes() {
    return <Route path="/service/account" element={<AccountRecommend />} />;
}
