import csv
import json
import re
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = AI_DIR / "data" / "raw"
PROCESSED_DIR = AI_DIR / "data" / "processed"

EXCLUDED_COMPANIES = {"MG손보"}
UNBORN_AGES = {"태아", "-1"}
TYPE_PREFIX = {
    "5세대 실손의료보험": ("(기본형)", "(특약1)", "(특약2)"),
    "유병력자": ("(유병력자)",),
    "노후": ("(노후)",),
}
TYPE_LABEL = {
    "5세대 실손의료보험": "일반",
    "유병력자": "유병력자",
    "노후": "노후",
}
INSURER_TYPE = {
    "생명보험협회": "생명보험",
    "손해보험협회": "손해보험",
}

COLUMNS = [
    "insurer_type",
    "cmpy_cd",
    "cmpy_nm",
    "prd_nm",
    "product_type",
    "is_direct",
    "age",
    "male_basic",
    "male_rider1",
    "male_rider2",
    "male_total",
    "female_basic",
    "female_rider1",
    "female_rider2",
    "female_total",
    "bas_dt",
]


def normalize_coverage(mog):
    return re.sub(r"\s+", "", mog or "")


def is_direct(product_name):
    return 1 if "다이렉트" in product_name or "(CM)" in product_name else 0


def coverage_group(product_type, coverage):
    for prefix in TYPE_PREFIX.get(product_type, ()):
        if coverage.startswith(prefix):
            return prefix
    return None


def load_raw(collected):
    path = RAW_DIR / f"insurance_latest_by_company_{collected}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def collect_premiums(records):
    seen = set()
    products = {}
    premiums = defaultdict(lambda: defaultdict(lambda: {"male": 0, "female": 0}))
    for r in records:
        if r["cmpyNm"] in EXCLUDED_COMPANIES or r["ptrn"] not in TYPE_PREFIX:
            continue
        if str(r["age"]).strip() in UNBORN_AGES:
            continue
        coverage = normalize_coverage(r["mog"])
        group = coverage_group(r["ptrn"], coverage)
        if group is None:
            continue
        key = (r["cmpyNm"], r["prdNm"], coverage, r["age"])
        if key in seen:
            continue
        seen.add(key)
        product_key = (r["cmpyNm"], r["prdNm"])
        products[product_key] = r
        bucket = premiums[(product_key, int(r["age"]))][group]
        bucket["male"] += int(r["mlInsRt"])
        bucket["female"] += int(r["fmlInsRt"])
    return products, premiums


def split_premium(product_type, groups, sex):
    if product_type == "5세대 실손의료보험":
        basic = groups["(기본형)"][sex]
        rider1 = groups["(특약1)"][sex]
        rider2 = groups["(특약2)"][sex]
        return basic, rider1, rider2, basic + rider1 + rider2
    total = sum(v[sex] for v in groups.values())
    return "", "", "", total


def build_rows(collected):
    products, premiums = collect_premiums(load_raw(collected))
    rows = []
    for (product_key, age), groups in sorted(premiums.items()):
        r = products[product_key]
        product_type = r["ptrn"]
        male = split_premium(product_type, groups, "male")
        female = split_premium(product_type, groups, "female")
        if male[3] == 0 and female[3] == 0:
            continue
        rows.append({
            "insurer_type": INSURER_TYPE.get(r["ofrInstNm"], r["ofrInstNm"]),
            "cmpy_cd": r["cmpyCd"],
            "cmpy_nm": r["cmpyNm"],
            "prd_nm": r["prdNm"],
            "product_type": TYPE_LABEL[product_type],
            "is_direct": is_direct(r["prdNm"]),
            "age": age,
            "male_basic": male[0],
            "male_rider1": male[1],
            "male_rider2": male[2],
            "male_total": male[3] or "",
            "female_basic": female[0],
            "female_rider1": female[1],
            "female_rider2": female[2],
            "female_total": female[3] or "",
            "bas_dt": r["basDt"],
        })
    return rows


def save_rows(rows, output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    collected = sys.argv[1] if len(sys.argv) > 1 else "20261015"
    rows = build_rows(collected)
    output_path = PROCESSED_DIR / f"insurance_{date.today():%Y%m%d}.csv"
    save_rows(rows, output_path)
    print(f"{len(rows)}행 저장: {output_path}")


if __name__ == "__main__":
    main()
