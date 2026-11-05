import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import PROCESSED_DIR, latest, print_summary, read_csv
from engine import decide_group, sort_results

PURPOSE_TO_LOAN_TYPE = {
    "생활비": "신용대출",
    "전세 보증금": "전세자금대출",
}
VISIT_NOT_WANTED = "원치 않음"


def load_products(path=None):
    return read_csv(path or latest(PROCESSED_DIR, "finlife_loans_*.csv"))


def rate_of(product):
    return float(product["rate_avg"]) if product["rate_avg"] else None


def judge(product, user):
    mismatch, check = [], []
    note = product.get("foreigner_note", "")
    if product["foreigner_status"] == "불일치":
        mismatch.append(note or "domestic_only")
    if user.get("visit") == VISIT_NOT_WANTED and product["visit_required"] == "1":
        mismatch.append("visit_required")
    if product["foreigner_status"] == "확인 필요":
        check.append(note or "foreigner_unspecified")
    check.append("limit_after_review")
    if product.get("target_limited") == "1":
        check.append("special_target")
    if rate_of(product) is None:
        check.append("rate_not_disclosed")
    if product.get("rate_inconsistent") == "1":
        check.append("rate_inconsistent")
    return mismatch, check


def recommend_fast(products, user):
    loan_type = PURPOSE_TO_LOAN_TYPE[user["purpose"]]
    results = []
    for product in products:
        if product["loan_type"] != loan_type:
            continue
        mismatch, check = judge(product, user)
        rate = rate_of(product)
        results.append({
            "product_id": f"{product['fin_co_no']}-{product['fin_prdt_cd']}",
            "kor_co_nm": product["kor_co_nm"],
            "company_display": product.get("company_display") or product["kor_co_nm"],
            "fin_prdt_nm": product["fin_prdt_nm"],
            "product_kind": product["product_kind"],
            "institution_type": product["institution_type"],
            "rate_avg": rate,
            "rate_min": float(product["rate_min"]) if product["rate_min"] else None,
            "rate_max": float(product["rate_max"]) if product["rate_max"] else None,
            "loan_limit_text": product["loan_limit_text"],
            "repay_types": product["repay_types"],
            "rate_types": product["rate_types"],
            "join_way": product["join_way"],
            "visit_required": product["visit_required"] == "1",
            "homepage": product.get("homepage", ""),
            "phone": product.get("phone", ""),
            "group": decide_group(mismatch, check),
            "score": -rate if rate is not None else None,
            "check_reasons": check,
            "mismatch_reasons": mismatch,
            "sort_last": rate is None or product.get("target_limited") == "1" or product.get("rate_inconsistent") == "1",
            "tiebreak": 0,
            "dcls_month": product["dcls_month"],
        })
    return loan_type, sort_results(results)


def describe(r):
    rate = "-" if r["rate_avg"] is None else f"{r['rate_avg']:.2f}%"
    return f"평균 {rate:>7} | {r['kor_co_nm']} {r['fin_prdt_nm']} ({r['product_kind']})"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    products = load_products()
    examples = [
        {"residence_status": "비전문취업(E-9)", "purpose": "생활비", "visit": "상관없음"},
        {"residence_status": "결혼이민(F-6)", "purpose": "전세 보증금", "visit": "원치 않음"},
    ]
    for user in examples:
        loan_type, results = recommend_fast(products, user)
        print_summary(f"{user['residence_status']}, {user['purpose']} → {loan_type}, 방문 {user['visit']}", results, describe)


if __name__ == "__main__":
    main()
