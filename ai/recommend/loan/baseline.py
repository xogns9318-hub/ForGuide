import csv
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine import (
    GROUP_MISMATCH,
    absolute_score,
    decide_group,
    sort_results,
    top_reasons,
    weighted_score,
)

AI_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = AI_DIR / "data" / "processed"

WEIGHTS = {
    "rate": 0.5,
    "check_count": -0.3,
    "visit_required": -0.2,
}
RATE_FULL_GAP = 3.0
PURPOSE_TO_LOAN_TYPE = {
    "생활비": "신용대출",
    "주거(전세)": "전세자금대출",
    "기타": "신용대출",
}


def load_products(path=None):
    if path is None:
        path = sorted(PROCESSED_DIR.glob("finlife_loans_*.csv"))[-1]
    with Path(path).open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def rate_of(product):
    return float(product["rate_avg"]) if product["rate_avg"] else None


def judge(product, user):
    mismatch, check = [], []
    if product["foreigner_status"] == "확인 필요":
        check.append("외국인 가입 조건 미기재")
    check.append("한도는 심사 후 결정")
    if rate_of(product) is None:
        check.append("평균 금리 미공시")
    return mismatch, check


def recommend_fast(products, user):
    loan_type = PURPOSE_TO_LOAN_TYPE[user["purpose"]]
    candidates = [p for p in products if p["loan_type"] == loan_type]

    judged = []
    best_rate_by_group = {}
    for product in candidates:
        mismatch, check = judge(product, user)
        group = decide_group(mismatch, check)
        judged.append((product, mismatch, check, group))
        rate = rate_of(product)
        if group != GROUP_MISMATCH and rate is not None:
            best_rate_by_group[group] = min(rate, best_rate_by_group.get(group, rate))

    results = []
    for product, mismatch, check, group in judged:
        rate = rate_of(product)
        score, reasons = None, []
        if group != GROUP_MISMATCH and rate is not None:
            features = {
                "rate": absolute_score(-best_rate_by_group[group], -rate, RATE_FULL_GAP),
                "check_count": 1 if product["foreigner_status"] == "확인 필요" else 0,
                "visit_required": int(product["visit_required"]),
            }
            score, contributions = weighted_score(features, WEIGHTS)
            reasons = top_reasons(contributions)
        results.append({
            "kor_co_nm": product["kor_co_nm"],
            "fin_prdt_nm": product["fin_prdt_nm"],
            "product_kind": product["product_kind"],
            "institution_type": product["institution_type"],
            "rate_avg": rate,
            "rate_min": product["rate_min"],
            "rate_max": product["rate_max"],
            "loan_limit_text": product["loan_limit_text"],
            "requested_amount": user["amount"],
            "group": group,
            "score": score,
            "reasons": reasons,
            "check_reasons": check,
            "mismatch_reasons": mismatch,
            "sort_last": rate is None,
            "tiebreak": -(rate if rate is not None else 0),
            "dcls_month": product["dcls_month"],
        })
    return loan_type, sort_results(results)


def print_summary(user, loan_type, results, limit=6):
    print(f"\n## {user['residence_status']}, {user['purpose']}, {user['amount']:,}만 원 → {loan_type}")
    for r in results[:limit]:
        score = "-" if r["score"] is None else f"{r['score']:.3f}"
        rate = "-" if r["rate_avg"] is None else f"{r['rate_avg']:.2f}%"
        print(f"  [{r['group']}] {score:>6} | 평균 {rate:>7} | {r['kor_co_nm']} {r['fin_prdt_nm']} ({r['product_kind']})")
    counts = defaultdict(int)
    for r in results:
        counts[r["group"]] += 1
    no_rate = sum(1 for r in results if r["rate_avg"] is None)
    print(f"  그룹별 개수: {dict(counts)} / 평균 금리 미공시 {no_rate}개(맨 아래)")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    products = load_products()
    examples = [
        {"residence_status": "비전문취업(E-9)", "purpose": "생활비", "amount": 300},
        {"residence_status": "결혼이민(F-6)", "purpose": "주거(전세)", "amount": 10000},
    ]
    for user in examples:
        loan_type, results = recommend_fast(products, user)
        print_summary(user, loan_type, results)


if __name__ == "__main__":
    main()
