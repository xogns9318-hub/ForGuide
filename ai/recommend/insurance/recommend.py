import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from baseline import GATE_PASS, load_rows, recommend_fast, separate_products

RESIDENCE_STATUSES = [
    "비전문취업(E-9)", "방문취업(H-2)", "전문인력", "유학생", "재외동포(F-4)", "영주(F-5)", "결혼이민(F-6)", "기타",
]
CHOICES = {
    "sex": ["남", "여"],
    "age": list(range(19, 100)),
}
TOP_N = 5
SEPARATE_N = 3
LOW_PREMIUM_RATIO = 1.2
SEPARATE_KEYS = {"노후": "senior", "유병력자": "simplified"}
GROUP_KEY = "check"
GUIDE = "ask_insurer_eligibility"
NOTICES = ["premium_may_change", "insurance_age_basis", "reference_only"]
REDIRECT = "consultation"


def validate(user):
    errors = {}
    if user.get("sex") not in CHOICES["sex"]:
        errors["sex"] = CHOICES["sex"]
    try:
        age = int(user.get("age"))
    except (TypeError, ValueError):
        age = None
    if age not in CHOICES["age"]:
        errors["age"] = [CHOICES["age"][0], CHOICES["age"][-1]]
    if user.get("residence_status") not in RESIDENCE_STATUSES:
        errors["residence_status"] = RESIDENCE_STATUSES
    if errors:
        raise ValueError(errors)
    return {**user, "age": age}


def card(result, rank, cheapest):
    item = {
        "rank": rank,
        "company": result["cmpy_nm"],
        "product_name": result["prd_nm"],
        "insurer_type": result["insurer_type"],
        "online": bool(result["is_direct"]),
        "monthly_premium": result["premium"],
        "contact": {"homepage": result["homepage"], "phone": result["phone"]},
    }
    if "basic" in result and result["basic"] != "":
        item["premium_breakdown"] = {"basic": int(result["basic"]), "rider1": int(result["rider1"]), "rider2": int(result["rider2"])}
    reasons = []
    if cheapest and result["premium"] <= cheapest * LOW_PREMIUM_RATIO:
        reasons.append("low_premium")
    if result["is_direct"]:
        reasons.append("online_join")
    item["reasons"] = reasons
    if result.get("check_reasons"):
        item["check_reasons"] = result["check_reasons"]
    return item


def one_per_company(results):
    leaders, more = [], {}
    for r in results:
        name = r["cmpy_nm"]
        if name in more:
            more[name] += 1
        else:
            more[name] = 0
            leaders.append(r)
    return leaders, more


def recommend(user, rows=None, top_n=TOP_N, separate_n=SEPARATE_N):
    if user.get("health_insurance") != GATE_PASS:
        return {"mode": "fast", "redirect": REDIRECT}
    user = validate(user)
    rows = rows if rows is not None else load_rows()
    output = recommend_fast(rows, user)
    results = output["results"]
    cheapest = min((r["premium"] for r in results), default=None)
    leaders, more = one_per_company(results)
    items = []
    for i, r in enumerate(leaders[:top_n], start=1):
        item = card(r, i, cheapest)
        if more[r["cmpy_nm"]]:
            item["more_from_company"] = more[r["cmpy_nm"]]
        items.append(item)
    separate = []
    for product_type, products in separate_products(rows, user).items():
        separate.append({
            "key": SEPARATE_KEYS[product_type],
            "total": len(products),
            "items": [card(r, i, None) for i, r in enumerate(products[:separate_n], start=1)],
        })
    dates = sorted({r["bas_dt"] for r in results if r["bas_dt"]})
    return {
        "mode": "fast",
        "redirect": None,
        "input": {"sex": user["sex"], "age": user["age"]},
        "base_date": dates[-1] if dates else "",
        "groups": [{
            "group": "확인 필요",
            "key": GROUP_KEY,
            "total": len(results),
            "companies": len(leaders),
            "guide": GUIDE,
            "items": items,
        }],
        "separate": sorted(separate, key=lambda s: s["key"]),
        "notices": NOTICES,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    user = {"health_insurance": "예", "residence_status": "비전문취업(E-9)", "sex": "남", "age": 30}
    print(json.dumps(recommend(user), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
