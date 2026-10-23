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
    "savings_bank": -0.1,
    "non_preferred_institution": -0.2,
}
RATE_FULL_GAP = 1.0
VISIT_NOT_WANTED = "원치 않음"
PREFER_BANK = "은행 선호"
BANK = "은행"
OUTLIER_REASON = "금리가 다른 상품보다 크게 높음: 가입 조건 확인"


def load_options(path=None):
    if path is None:
        path = sorted(PROCESSED_DIR.glob("finlife_savings_*.csv"))[-1]
    with Path(path).open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def best_option_per_product(options, purpose, term):
    best = {}
    for option in options:
        if option["purpose"] != purpose or int(option["save_trm"]) != term:
            continue
        if option["effective_rate"] == "":
            continue
        key = (option["fin_co_no"], option["fin_prdt_cd"])
        rate = float(option["effective_rate"])
        if key not in best or rate > float(best[key]["effective_rate"]):
            best[key] = option
    return list(best.values())


def judge(product, user):
    mismatch, check = [], []
    note = product.get("foreigner_note", "")
    if product["foreigner_status"] == "불일치":
        mismatch.append(note or "내국인만 가입")
    if product["visit_required"] == "1" and user["visit"] == VISIT_NOT_WANTED:
        mismatch.append("영업점 방문 필요")
    if product["foreigner_status"] == "확인 필요":
        check.append(note or "외국인 가입 조건 미기재")
    if product["region_limit"]:
        check.append(f"가입 지역 제한: {product['region_limit']}")
    if product.get("rate_outlier") == "1":
        check.append(OUTLIER_REASON)
    return mismatch, check


def recommend_fast(options, user, weights=None):
    weights = weights or WEIGHTS
    term = int(user["term"])
    products = best_option_per_product(options, user["purpose"], term)
    judged = []
    best_rate_by_group = {}
    best_with_outliers = {}
    for product in products:
        mismatch, check = judge(product, user)
        group = decide_group(mismatch, check)
        judged.append((product, mismatch, check, group))
        if group != GROUP_MISMATCH:
            rate = float(product["effective_rate"])
            best_with_outliers[group] = max(rate, best_with_outliers.get(group, rate))
            if product.get("rate_outlier") != "1":
                best_rate_by_group[group] = max(rate, best_rate_by_group.get(group, rate))
    for group, rate in best_with_outliers.items():
        best_rate_by_group.setdefault(group, rate)

    results = []
    for product, mismatch, check, group in judged:
        score, reasons, features = None, [], None
        if group != GROUP_MISMATCH:
            features = {
                "rate": absolute_score(best_rate_by_group[group], float(product["effective_rate"]), RATE_FULL_GAP),
                "check_count": 1 if product["foreigner_status"] == "확인 필요" else 0,
                "visit_required": int(product["visit_required"]),
                "savings_bank": int(product["institution_type"] != BANK),
                "non_preferred_institution": int(user["institution"] == PREFER_BANK and product["institution_type"] != BANK),
            }
            score, contributions = weighted_score(features, weights)
            reasons = top_reasons(contributions)
        results.append({
            "product_id": f"{product['fin_co_no']}-{product['fin_prdt_cd']}",
            "kor_co_nm": product["kor_co_nm"],
            "fin_prdt_nm": product["fin_prdt_nm"],
            "institution_type": product["institution_type"],
            "save_trm": term,
            "intr_rate_type": product["intr_rate_type"],
            "intr_rate": float(product["intr_rate"]),
            "effective_rate": float(product["effective_rate"]),
            "join_way": product["join_way"],
            "visit_required": product["visit_required"] == "1",
            "rate_outlier": product.get("rate_outlier") == "1",
            "homepage": product.get("homepage", ""),
            "phone": product.get("phone", ""),
            "group": group,
            "score": score,
            "features": features,
            "reasons": reasons,
            "check_reasons": check,
            "mismatch_reasons": mismatch,
            "region_limit": product["region_limit"],
            "sort_last": bool(product["region_limit"]) or product.get("rate_outlier") == "1",
            "tiebreak": float(product["effective_rate"]),
            "dcls_month": product["dcls_month"],
        })
    return term, sort_results(results)


def print_summary(user, term, results, per_group=5):
    print(f"\n## {user['purpose']} {term}개월, 방문 {user['visit']}, 금융기관 {user['institution']}")
    shown = defaultdict(int)
    for r in results:
        if shown[r["group"]] >= per_group:
            continue
        shown[r["group"]] += 1
        score = "-" if r["score"] is None else f"{r['score']:.3f}"
        extra = r["mismatch_reasons"] or r["check_reasons"]
        print(f"  [{r['group']}] {score:>6} | {r['effective_rate']:.3f}% | {r['kor_co_nm']} {r['fin_prdt_nm']} | {', '.join(extra)}")
    counts = defaultdict(int)
    for r in results:
        counts[r["group"]] += 1
    print("  그룹별 개수:", dict(counts))


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    options = load_options()
    examples = [
        {"residence_status": "비전문취업(E-9)", "purpose": "예금", "term": 6, "visit": "상관없음", "institution": "상관없음"},
        {"residence_status": "결혼이민(F-6)", "purpose": "예금", "term": 12, "visit": "원치 않음", "institution": "은행 선호"},
        {"residence_status": "유학생", "purpose": "적금", "term": 24, "visit": "상관없음", "institution": "은행 선호"},
    ]
    for user in examples:
        term, results = recommend_fast(options, user)
        print_summary(user, term, results)


if __name__ == "__main__":
    main()
