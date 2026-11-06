import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "recommend"))

from common import PROCESSED_DIR, load_finlife, today, write_csv
from clean_finlife_savings import FOREIGNER_OVERRIDES, clean_text, display_company, load_companies

INSTITUTION_TYPES = {
    "020000": "은행",
    "030300": "저축은행",
}
EXCLUDED_CREDIT_TYPES = {"장기카드대출(카드론)"}
TARGET_KEYWORDS = re.compile(r"청년|신혼|다자녀|사회초년|버팀목|디딤돌|군인|공무원|교직원|임직원")
CREDIT_RATE_TYPE = "A"
ONLINE_CHANNELS = {"인터넷", "스마트폰", "전화(텔레뱅킹)"}
RATE_GAP_LIMIT = 1.0
CREDIT_GRADE_COLUMNS = [
    "crdt_grad_1",
    "crdt_grad_4",
    "crdt_grad_5",
    "crdt_grad_6",
    "crdt_grad_10",
    "crdt_grad_11",
    "crdt_grad_12",
    "crdt_grad_13",
]

COLUMNS = [
    "loan_type",
    "fin_co_no",
    "kor_co_nm",
    "company_display",
    "institution_type",
    "fin_prdt_cd",
    "fin_prdt_nm",
    "product_kind",
    "foreigner_status",
    "foreigner_note",
    "target_limited",
    "join_way",
    "visit_required",
    "rate_avg",
    "rate_min",
    "rate_max",
    "rate_inconsistent",
    "loan_limit_text",
    "repay_types",
    "rate_types",
    "homepage",
    "phone",
    "dcls_month",
]


def is_visit_required(join_way):
    channels = [c.strip() for c in (join_way or "").split(",") if c.strip()]
    return 1 if channels and not ONLINE_CHANNELS.intersection(channels) else 0


def is_rate_inconsistent(row):
    if row["rate_avg"] == "" or row["rate_min"] == "" or row["rate_max"] == "":
        return 0
    average = float(row["rate_avg"])
    return int(average < float(row["rate_min"]) - RATE_GAP_LIMIT or average > float(row["rate_max"]) + RATE_GAP_LIMIT)


def options_by_product(option_list):
    grouped = {}
    for option in option_list:
        grouped.setdefault((option["fin_co_no"], option["fin_prdt_cd"]), []).append(option)
    return grouped


def base_row(product, loan_type, institution_type):
    return {
        "loan_type": loan_type,
        "fin_co_no": product["fin_co_no"],
        "kor_co_nm": product["kor_co_nm"],
        "company_display": display_company(product["kor_co_nm"]),
        "institution_type": institution_type,
        "fin_prdt_cd": product["fin_prdt_cd"],
        "fin_prdt_nm": clean_text(product["fin_prdt_nm"]),
        "foreigner_status": FOREIGNER_OVERRIDES.get(product["kor_co_nm"], ("확인 필요", ""))[0],
        "foreigner_note": FOREIGNER_OVERRIDES.get(product["kor_co_nm"], ("확인 필요", ""))[1],
        "target_limited": int(bool(TARGET_KEYWORDS.search(product["fin_prdt_nm"]))),
        "join_way": product.get("join_way") or "",
        "visit_required": is_visit_required(product.get("join_way")),
        "dcls_month": product.get("dcls_month") or "",
    }


def credit_rows():
    rows = []
    for group, institution_type in INSTITUTION_TYPES.items():
        base_list, option_list = load_finlife("creditLoanProductsSearch", group)
        options = options_by_product(option_list)
        for product in base_list:
            if product.get("crdt_prdt_type_nm") in EXCLUDED_CREDIT_TYPES:
                continue
            rate_options = [
                o for o in options.get((product["fin_co_no"], product["fin_prdt_cd"]), [])
                if o.get("crdt_lend_rate_type") == CREDIT_RATE_TYPE
            ]
            if not rate_options:
                continue
            option = rate_options[0]
            grades = [option[c] for c in CREDIT_GRADE_COLUMNS if option.get(c) is not None]
            row = base_row(product, "신용대출", institution_type)
            row.update({
                "product_kind": product.get("crdt_prdt_type_nm") or "",
                "rate_avg": option.get("crdt_grad_avg") if option.get("crdt_grad_avg") is not None else "",
                "rate_min": min(grades) if grades else "",
                "rate_max": max(grades) if grades else "",
                "loan_limit_text": "",
                "repay_types": "",
                "rate_types": "",
            })
            rows.append(row)
    return rows


def rent_rows():
    rows = []
    for group, institution_type in INSTITUTION_TYPES.items():
        base_list, option_list = load_finlife("rentHouseLoanProductsSearch", group)
        options = options_by_product(option_list)
        for product in base_list:
            product_options = options.get((product["fin_co_no"], product["fin_prdt_cd"]), [])
            if not product_options:
                continue
            averages = [o["lend_rate_avg"] for o in product_options if o.get("lend_rate_avg") is not None]
            minimums = [o["lend_rate_min"] for o in product_options if o.get("lend_rate_min") is not None]
            maximums = [o["lend_rate_max"] for o in product_options if o.get("lend_rate_max") is not None]
            row = base_row(product, "전세자금대출", institution_type)
            row.update({
                "product_kind": "전세자금대출",
                "rate_avg": min(averages) if averages else "",
                "rate_min": min(minimums) if minimums else "",
                "rate_max": max(maximums) if maximums else "",
                "loan_limit_text": (product.get("loan_lmt") or "").replace("\n", " ").strip(),
                "repay_types": ",".join(sorted({o.get("rpay_type_nm") or "" for o in product_options})),
                "rate_types": ",".join(sorted({o.get("lend_rate_type_nm") or "" for o in product_options})),
            })
            rows.append(row)
    return rows


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    rows = credit_rows() + rent_rows()
    companies = load_companies()
    for row in rows:
        contact = companies.get(row["fin_co_no"], {})
        row["homepage"] = contact.get("homepage", "")
        row["phone"] = contact.get("phone", "")
        row["rate_inconsistent"] = is_rate_inconsistent(row)
    output_path = write_csv(rows, PROCESSED_DIR / f"finlife_loans_{today()}.csv", COLUMNS)
    print(f"{len(rows)}행 저장: {output_path}")


if __name__ == "__main__":
    main()
