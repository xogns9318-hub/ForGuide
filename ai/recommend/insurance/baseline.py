import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine import (
    absolute_score,
    decide_group,
    sort_results,
    top_reasons,
    weighted_score,
)

AI_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = AI_DIR / "data" / "processed"

WEIGHTS = {
    "premium": 1.0,
}
PREMIUM_FULL_GAP_RATIO = 0.5
COMPARED_TYPE = "일반"
SEPARATE_TYPES = ("노후", "유병력자")
GATE_PASS = "예"
SEX_COLUMNS = {"남": "male_total", "여": "female_total"}


def load_rows(path=None):
    if path is None:
        path = sorted(PROCESSED_DIR.glob("insurance_*.csv"))[-1]
    with Path(path).open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def passes_gate(user):
    return user["health_insurance"] == GATE_PASS


def premium_of(row, sex):
    value = row[SEX_COLUMNS[sex]]
    return int(value) if value else None


def judge(row, user):
    mismatch = []
    check = ["보험사 외국인 가입 심사"]
    return mismatch, check


def separate_options(rows, user):
    found = []
    for row in rows:
        if row["product_type"] in SEPARATE_TYPES and int(row["age"]) == user["age"]:
            if premium_of(row, user["sex"]) is not None:
                found.append(row["product_type"])
    return sorted(set(found))


def recommend_fast(rows, user):
    if not passes_gate(user):
        return {"redirect": "상담", "results": [], "separate_types": []}

    candidates = [
        r for r in rows
        if r["product_type"] == COMPARED_TYPE
        and int(r["age"]) == user["age"]
        and premium_of(r, user["sex"]) is not None
    ]
    premiums = [premium_of(r, user["sex"]) for r in candidates]
    cheapest = min(premiums) if premiums else None

    results = []
    for row in candidates:
        premium = premium_of(row, user["sex"])
        mismatch, check = judge(row, user)
        features = {
            "premium": absolute_score(-cheapest, -premium, cheapest * PREMIUM_FULL_GAP_RATIO),
        }
        score, contributions = weighted_score(features, WEIGHTS)
        results.append({
            "cmpy_nm": row["cmpy_nm"],
            "prd_nm": row["prd_nm"],
            "insurer_type": row["insurer_type"],
            "is_direct": int(row["is_direct"]),
            "premium": premium,
            "basic": row["male_basic" if user["sex"] == "남" else "female_basic"],
            "group": decide_group(mismatch, check),
            "score": score,
            "reasons": top_reasons(contributions),
            "check_reasons": check,
            "mismatch_reasons": mismatch,
            "tiebreak": -premium,
            "bas_dt": row["bas_dt"],
        })
    return {
        "redirect": None,
        "results": sort_results(results),
        "separate_types": separate_options(rows, user),
    }


def print_summary(user, output, limit=5):
    print(f"\n## 건강보험 {user['health_insurance']}, {user['residence_status']}, {user['age']}세, {user['sex']}")
    if output["redirect"]:
        print(f"  → {output['redirect']} 탭으로 연결")
        return
    for r in output["results"][:limit]:
        direct = "다이렉트" if r["is_direct"] else ""
        print(f"  [{r['group']}] {r['score']:.3f} | {r['premium']:>6,} | {r['cmpy_nm']} {r['prd_nm']} {direct}")
    print(f"  비교 상품 {len(output['results'])}개", end="")
    if output["separate_types"]:
        print(f" / 별도 안내: {', '.join(output['separate_types'])}형")
    else:
        print()


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    rows = load_rows()
    examples = [
        {"health_insurance": "예", "residence_status": "비전문취업(E-9)", "age": 28, "sex": "남"},
        {"health_insurance": "예", "residence_status": "결혼이민(F-6)", "age": 35, "sex": "여"},
        {"health_insurance": "예", "residence_status": "영주(F-5)", "age": 55, "sex": "남"},
        {"health_insurance": "모름", "residence_status": "유학생", "age": 23, "sex": "여"},
    ]
    for user in examples:
        print_summary(user, recommend_fast(rows, user))


if __name__ == "__main__":
    main()
