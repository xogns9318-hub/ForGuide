export const DEPOSIT_AMOUNT = 10000000;
export const MONTHLY_SAVING = 500000;

export function estimateInterest(purpose, ratePercent, rateType, months) {
    const monthly = ratePercent / 100 / 12;
    const compound = rateType === "복리";

    if (purpose === "예금") {
        const interest = compound
            ? DEPOSIT_AMOUNT * ((1 + monthly) ** months - 1)
            : DEPOSIT_AMOUNT * monthly * months;
        return Math.round(interest);
    }

    let interest = 0;
    for (let paid = 1; paid <= months; paid += 1) {
        interest += compound
            ? MONTHLY_SAVING * ((1 + monthly) ** paid - 1)
            : MONTHLY_SAVING * monthly * paid;
    }
    return Math.round(interest);
}

export function homepageUrl(homepage) {
    if (!homepage) return "";
    return /^https?:\/\//i.test(homepage) ? homepage : `http://${homepage}`;
}
