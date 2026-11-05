import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "recommend"))

from common import PROCESSED_DIR, RAW_DIR, latest, today, write_csv

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
COMPANY_GROUP = "050000"
OFFICIAL_NAMES = {
    "DB손보": "DB손해보험주식회사",
    "KB손보": "주식회사KB손해보험",
    "NH농협생명": "농협생명보험주식회사",
    "교보생명": "교보생명보험주식회사",
    "농협손보": "농협손해보험주식회사",
    "동양생명": "동양생명보험주식회사",
    "롯데손보": "롯데손해보험주식회사",
    "삼성생명": "삼성생명보험주식회사",
    "삼성화재": "삼성화재해상보험주식회사",
    "한화생명": "한화생명보험주식회사",
    "현대해상": "현대해상화재보험주식회사",
    "흥국생명": "흥국생명보험주식회사",
    "흥국화재": "흥국화재해상보험주식회사",
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
    "homepage",
    "phone",
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


def load_raw():
    return json.loads(latest(RAW_DIR, "insurance_latest_by_company_*.json").read_text(encoding="utf-8"))


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


def load_contacts():
    files = sorted(RAW_DIR.glob(f"finlife_companySearch_{COMPANY_GROUP}_*.json"))
    if not files:
        return {}
    by_name = {c["kor_co_nm"]: c for c in json.loads(files[-1].read_text(encoding="utf-8"))["baseList"]}
    contacts = {}
    for short, official in OFFICIAL_NAMES.items():
        company = by_name.get(official)
        if company:
            contacts[short] = {"homepage": (company.get("homp_url") or "").strip(), "phone": (company.get("cal_tel") or "").strip()}
    return contacts


def build_rows():
    products, premiums = collect_premiums(load_raw())
    contacts = load_contacts()
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
            "homepage": contacts.get(r["cmpyNm"], {}).get("homepage", ""),
            "phone": contacts.get(r["cmpyNm"], {}).get("phone", ""),
            "bas_dt": r["basDt"],
        })
    return rows


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    rows = build_rows()
    output_path = write_csv(rows, PROCESSED_DIR / f"insurance_{today()}.csv", COLUMNS)
    print(f"{len(rows)}행 저장: {output_path}")


if __name__ == "__main__":
    main()
