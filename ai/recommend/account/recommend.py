import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine import GROUP_CHECK, GROUP_MATCH, GROUP_MISMATCH
from baseline import PREFER_BANK, VISIT_NOT_WANTED, WEIGHTS, load_options, recommend_fast

AI_DIR = Path(__file__).resolve().parent.parent.parent
WEIGHTS_PATH = AI_DIR / "models" / "account_fast_weights.json"

CHOICES = {
    "purpose": ["예금", "적금"],
    "term": [6, 12, 24, 36],
    "visit": ["상관없음", "원치 않음"],
    "institution": ["은행 선호", "상관없음"],
}
TOP_N = 5
MISMATCH_N = 3
HIGH_RATE_SCORE = 0.5
RATE_TYPES = {"S": "단리", "M": "복리"}
GROUP_GUIDES = {
    GROUP_MATCH: "join_at_company",
    GROUP_CHECK: "ask_foreigner_eligibility",
}
GROUP_KEYS = {GROUP_MATCH: "match", GROUP_CHECK: "check", GROUP_MISMATCH: "mismatch"}
NOTICES = ["rate_may_change", "savings_bank_protected", "reference_only"]


def load_weights(path=WEIGHTS_PATH):
    if Path(path).exists():
        return json.loads(Path(path).read_text(encoding="utf-8"))["weights"], "learned"
    return WEIGHTS, "baseline"


def validate(user):
    errors = {}
    for name, allowed in CHOICES.items():
        value = user.get(name)
        if name == "term":
            try:
                value = int(value)
            except (TypeError, ValueError):
                value = None
        if value not in allowed:
            errors[name] = allowed
    if errors:
        raise ValueError(errors)
    return {**user, "term": int(user["term"])}


def reason_keys(result, weights, user, limit=3):
    features = result["features"]
    benefits = {
        "high_rate": weights["rate"] * features["rate"] if features["rate"] >= HIGH_RATE_SCORE else 0,
        "no_visit": abs(weights["visit_required"]) * (1 - features["visit_required"]) if user["visit"] != VISIT_NOT_WANTED else 0,
        "bank": (abs(weights["savings_bank"]) + (abs(weights["non_preferred_institution"]) if user["institution"] == PREFER_BANK else 0))
        * (1 - features["savings_bank"]),
    }
    ordered = sorted(benefits.items(), key=lambda kv: -kv[1])
    return [key for key, value in ordered if value > 0][:limit]


def card(result, rank, weights, user):
    item = {
        "rank": rank,
        "product_id": result["product_id"],
        "purpose": user["purpose"],
        "company": result["kor_co_nm"],
        "product_name": result["fin_prdt_nm"],
        "institution_type": result["institution_type"],
        "term_months": result["save_trm"],
        "base_rate": result["intr_rate"],
        "rate_type": RATE_TYPES.get(result["intr_rate_type"], result["intr_rate_type"]),
        "effective_rate": round(result["effective_rate"], 2),
        "join_way": result["join_way"],
        "visit_required": result["visit_required"],
        "contact": {"homepage": result["homepage"], "phone": result["phone"]},
    }
    if result["group"] == GROUP_MISMATCH:
        item["mismatch_reasons"] = result["mismatch_reasons"]
        return item
    item["reasons"] = reason_keys(result, weights, user)
    if result["check_reasons"]:
        item["check_reasons"] = result["check_reasons"]
    if result["region_limit"]:
        item["region_limit"] = result["region_limit"].split(",")
    if result["rate_outlier"]:
        item["rate_outlier"] = True
    return item


def one_per_company(members):
    leaders, more = [], {}
    for r in members:
        name = r["kor_co_nm"]
        if name in more:
            more[name] += 1
        else:
            more[name] = 0
            leaders.append(r)
    return leaders, more


def recommend(user, options=None, weights=None, top_n=TOP_N, mismatch_n=MISMATCH_N):
    user = validate(user)
    options = options if options is not None else load_options()
    if weights is None:
        weights, weight_source = load_weights()
    else:
        weight_source = "given"
    _, results = recommend_fast(options, user, weights)

    groups = []
    for group in (GROUP_MATCH, GROUP_CHECK):
        members = [r for r in results if r["group"] == group]
        leaders, more = one_per_company(members)
        items = []
        for i, r in enumerate(leaders[:top_n], start=1):
            item = card(r, i, weights, user)
            if more[r["kor_co_nm"]]:
                item["more_from_company"] = more[r["kor_co_nm"]]
            items.append(item)
        groups.append({
            "group": group,
            "key": GROUP_KEYS[group],
            "total": len(members),
            "companies": len(leaders),
            "guide": GROUP_GUIDES[group],
            "items": items,
        })
    mismatched = [r for r in results if r["group"] == GROUP_MISMATCH]
    months = sorted({r["dcls_month"] for r in results if r["dcls_month"]})

    return {
        "mode": "fast",
        "input": {name: user[name] for name in CHOICES},
        "base_month": months[-1] if months else "",
        "weights": weight_source,
        "groups": groups,
        "mismatch": {
            "key": GROUP_KEYS[GROUP_MISMATCH],
            "total": len(mismatched),
            "items": [card(r, i, weights, user) for i, r in enumerate(mismatched[:mismatch_n], start=1)],
        },
        "notices": NOTICES,
    }


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    user = {"purpose": "예금", "term": 12, "visit": "상관없음", "institution": "상관없음"}
    print(json.dumps(recommend(user), ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
