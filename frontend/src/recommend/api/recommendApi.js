import { client } from "../../api/client.js";

function fast(product, input) {
    const query = new URLSearchParams(input).toString();
    return client.get(`/recommend/${product}/fast?${query}`);
}

export function getAccountChoices() {
    return client.get("/recommend/account/choices");
}

export function getAccountRecommendation(input) {
    return fast("account", input);
}

export function getInsuranceChoices() {
    return client.get("/recommend/insurance/choices");
}

export function getInsuranceRecommendation(input) {
    return fast("insurance", input);
}

export function getLoanChoices() {
    return client.get("/recommend/loan/choices");
}

export function getLoanRecommendation(input) {
    return fast("loan", input);
}
