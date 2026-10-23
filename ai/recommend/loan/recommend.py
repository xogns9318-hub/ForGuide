import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine import GROUP_CHECK, GROUP_MISMATCH
from baseline import PURPOSE_TO_LOAN_TYPE, load_products, recommend_fast

RESIDENCE_STATUSES = [
    "비전문취업(E-9)", "방문취업(H-2)", "전문인력", "유학생", "재외동포(F-4)", "영주(F-5)", "결혼이민(F-6)", "기타",
]
CHOICES = {"purpose": list(PURPOSE_TO_LOAN_TYPE)}
TOP_N = 5
MISMATCH_N = 3
LOW_RATE_GAP = 0.5
GROUP_KEY = "check"
GUIDE = "ask_loan_eligibility"
NOTICES = ["rate_by_credit", "rate_may_change", "reference_only"]
LOAN_TYPE_KEYS = {"신용대출": "credit", "전세자금대출": "jeonse"}


def validate(user):
    errors = {}
    if user.get("purpose") not in CHOICES["purpose"]:
        errors["purpose"] = CHOICES["purpose"]
    if user.get("residence_status") not in RESIDENCE_STATUSES:
        errors["residence_status"] = RESIDENCE_STATUSES
    if errors:
        raise ValueError(errors)
    return user


def reason_keys(result, best_rate):
    reasons = []
    if result["rate_avg"] is not None and best_rate is not None and result["rate_avg"] <= best_rate + LOW_RATE_GAP:
        reasons.append("low_rate")
    if result["institution_type"] == "은행":
        reasons.append("bank")
    if not result["visit_required"]:
        reasons.append("no_visit")
    return reasons


def card(result, rank, best_rate):
    item = {
        "rank": rank,
        "product_id": result["product_id"],
        "company": result["kor_co_nm"],
        "product_name": result["fin_prdt_nm"],
        "product_kind": result["product_kind"],
        "institution_type": result["institution_type"],
        "rate_avg": result["rate_avg"],
        "rate_range": [result["rate_min"], result["rate_max"]],
        "join_way": result["join_way"],
        "visit_required": result["visit_required"],
        "contact": {"homepage": result["homepage"], "phone": result["phone"]},
        "reasons": reason_keys(result, best_rate),
        "check_reasons": result["check_reasons"],
    }
    if result["loan_limit_text"]:
        item["limit_text"] = result["loan_limit_text"]
    if result["repay_types"]:
        item["repay_types"] = result["repay_types"].split(",")
    return item


def mismatch_card(result, rank):
    return {
        "rank": rank,
        "product_id": result["product_id"],
        "company": result["kor_co_nm"],
        "product_name": result["fin_prdt_nm"],
        "product_kind": result["product_kind"],
        "institution_type": result["institution_type"],
        "mismatch_reasons": result["mismatch_reasons"],
    }


def one_per_company(results):
    leaders, more = [], {}
    for r in results:
        name = r["kor_co_nm"]
        if name in more:
            more[name] += 1
        else:
            more[name] = 0
            leaders.append(r)
    return leaders, more


def recommend(user, products=None, top_n=TOP_N):
    user = validate(user)
    products = products if products is not None else load_products()
    loan_type, all_results = recommend_fast(products, user)
    results = [r for r in all_results if r["group"] != GROUP_MISMATCH]
    mismatched = [r for r in all_results if r["group"] == GROUP_MISMATCH]
    best_rate = min((r["rate_avg"] for r in results if r["rate_avg"] is not None), default=None)
    leaders, more = one_per_company(results)
    items = []
    for i, r in enumerate(leaders[:top_n], start=1):
        item = card(r, i, best_rate)
        if more[r["kor_co_nm"]]:
            item["more_from_company"] = more[r["kor_co_nm"]]
        items.append(item)
    months = sorted({r["dcls_month"] for r in results if r["dcls_month"]})
    return {
        "mode": "fast",
        "input": {"purpose": user["purpose"]},
        "loan_type": LOAN_TYPE_KEYS[loan_type],
        "base_month": months[-1] if months else "",
        "groups": [{
            "group": GROUP_CHECK,
            "key": GROUP_KEY,
            "total": len(results),
            "companies": len(leaders),
            "guide": GUIDE,
            "items": items,
        }],
        "mismatch": {
            "key": "mismatch",
            "total": len(mismatched),
            "items": [mismatch_card(r, i) for i, r in enumerate(mismatched[:MISMATCH_N], start=1)],
        },
        "notices": NOTICES,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    user = {"residence_status": "비전문취업(E-9)", "purpose": "생활비"}
    print(json.dumps(recommend(user), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
