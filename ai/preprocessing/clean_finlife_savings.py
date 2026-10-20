import csv
import json
import re
import statistics
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = AI_DIR / "data" / "raw"
PROCESSED_DIR = AI_DIR / "data" / "processed"

SOURCES = {
    "depositProductsSearch": "예금",
    "savingProductsSearch": "적금",
}
INSTITUTION_TYPES = {
    "020000": "은행",
    "030300": "저축은행",
}

FOREIGNER_ALLOWED = re.compile(r"비거주\s*외국인\s*(외|제외)|내\s*[·ㆍ]?\s*외국인")
FOREIGNER_DENIED = re.compile(r"내국인")
REGION_STOPWORDS = re.compile(r"비대면|대면|특판|회전|정기|예금|적금|개인|법인|모바일|인터넷|스마트|단리|복리|만기|자유|정액|이벤트|신규|고객|우대|플러스|변동|고정|금리|영업점|창구|전용|월수|\d")
BRANCH_SUFFIX = re.compile(r"(본점|지점)$")
WHITESPACE = re.compile(r"\s+")
OUTLIER_IQR_FACTOR = 1.5

COLUMNS = [
    "fin_co_no",
    "kor_co_nm",
    "institution_type",
    "fin_prdt_cd",
    "fin_prdt_nm",
    "purpose",
    "foreigner_status",
    "join_member",
    "join_deny",
    "join_way",
    "visit_required",
    "region_limit",
    "save_trm",
    "intr_rate_type",
    "rsrv_type",
    "intr_rate",
    "intr_rate2",
    "effective_rate",
    "rate_outlier",
    "dcls_month",
]


def clean_text(value):
    return WHITESPACE.sub(" ", value or "").strip()


def classify_foreigner(join_member):
    text = join_member or ""
    if FOREIGNER_ALLOWED.search(text):
        return "부합"
    if FOREIGNER_DENIED.search(text):
        return "불일치"
    return "확인 필요"


def is_visit_required(join_way):
    channels = [c.strip() for c in (join_way or "").split(",") if c.strip()]
    return 1 if channels == ["영업점"] else 0


def extract_region(product_name, visit_required):
    if not visit_required:
        return ""
    for inside in re.findall(r"\(([^)]*)\)", product_name or ""):
        tokens = [BRANCH_SUFFIX.sub("", t.strip()) for t in re.split(r"[,·ㆍ/]", inside) if t.strip()]
        if tokens and all(re.fullmatch(r"[가-힣]{2,4}", t) and not REGION_STOPWORDS.search(t) for t in tokens):
            return ",".join(tokens)
    return ""


def deposit_effective_rate(rate, months, rate_type):
    r = rate / 100
    if rate_type == "M":
        return ((1 + r / 12) ** months - 1) / (months / 12) * 100
    return rate


def saving_effective_rate(rate, months, rate_type):
    r = rate / 100
    simple_interest_base = months * (months + 1) / 24
    if rate_type == "M":
        interest = sum((1 + r / 12) ** k - 1 for k in range(1, months + 1))
        return interest / simple_interest_base * 100
    return rate


def effective_rate(purpose, rate, months, rate_type):
    if rate is None or months <= 0:
        return None
    if purpose == "예금":
        return deposit_effective_rate(rate, months, rate_type)
    return saving_effective_rate(rate, months, rate_type)


def load_raw(service, group, collected):
    path = RAW_DIR / f"finlife_{service}_{group}_{collected}.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return data["baseList"], data["optionList"]


def build_rows(collected):
    rows = []
    for service, purpose in SOURCES.items():
        for group, institution_type in INSTITUTION_TYPES.items():
            base_list, option_list = load_raw(service, group, collected)
            products = {(b["fin_co_no"], b["fin_prdt_cd"]): b for b in base_list}
            for option in option_list:
                product = products.get((option["fin_co_no"], option["fin_prdt_cd"]))
                if product is None:
                    continue
                months = int(option["save_trm"])
                name = clean_text(product["fin_prdt_nm"])
                visit = is_visit_required(product.get("join_way"))
                rate = option.get("intr_rate")
                effective = effective_rate(purpose, rate, months, option.get("intr_rate_type"))
                rows.append({
                    "fin_co_no": product["fin_co_no"],
                    "kor_co_nm": product["kor_co_nm"],
                    "institution_type": institution_type,
                    "fin_prdt_cd": product["fin_prdt_cd"],
                    "fin_prdt_nm": name,
                    "purpose": purpose,
                    "foreigner_status": classify_foreigner(product.get("join_member")),
                    "join_member": clean_text(product.get("join_member")),
                    "join_deny": product.get("join_deny") or "",
                    "join_way": product.get("join_way") or "",
                    "visit_required": visit,
                    "region_limit": extract_region(name, visit),
                    "save_trm": months,
                    "intr_rate_type": option.get("intr_rate_type") or "",
                    "rsrv_type": option.get("rsrv_type") or "",
                    "intr_rate": "" if rate is None else rate,
                    "intr_rate2": "" if option.get("intr_rate2") is None else option["intr_rate2"],
                    "effective_rate": "" if effective is None else round(effective, 4),
                    "rate_outlier": 0,
                    "dcls_month": product.get("dcls_month") or "",
                })
    return rows


def mark_rate_outliers(rows):
    groups = defaultdict(list)
    for row in rows:
        if row["effective_rate"] != "":
            groups[(row["purpose"], row["save_trm"])].append(row)
    for group_rows in groups.values():
        rates = [row["effective_rate"] for row in group_rows]
        if len(rates) < 4:
            continue
        q1, _, q3 = statistics.quantiles(rates, n=4)
        upper = q3 + OUTLIER_IQR_FACTOR * (q3 - q1)
        for row in group_rows:
            row["rate_outlier"] = int(row["effective_rate"] > upper)
    return rows


def save_rows(rows, output_path):
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    collected = sys.argv[1] if len(sys.argv) > 1 else "20261014"
    rows = mark_rate_outliers(build_rows(collected))
    output_path = PROCESSED_DIR / f"finlife_savings_{date.today():%Y%m%d}.csv"
    save_rows(rows, output_path)
    print(f"{len(rows)}행 저장: {output_path}")
    print(f"금리 이상값 {sum(row['rate_outlier'] for row in rows)}행 표시")


if __name__ == "__main__":
    main()
