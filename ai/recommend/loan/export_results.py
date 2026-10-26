import importlib.util
import json
import sys
from datetime import date
from pathlib import Path

LOAN_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LOAN_DIR.parent))
sys.path.insert(0, str(LOAN_DIR))

from baseline import load_products

spec = importlib.util.spec_from_file_location("loan_recommend", LOAN_DIR / "recommend.py")
loan_recommend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(loan_recommend)

AI_DIR = LOAN_DIR.parent.parent
DEFAULT_OUT = AI_DIR.parent / "backend" / "src" / "main" / "resources" / "recommend" / "loan_fast.json"
EXPORT_TOP_N = 20
KEY_ORDER = ["purpose", "visit"]


def result_key(user):
    return "|".join(str(user[name]) for name in KEY_ORDER)


def export(out_path=DEFAULT_OUT):
    products = load_products()
    results = {}
    for purpose in loan_recommend.CHOICES["purpose"]:
        for visit in loan_recommend.CHOICES["visit"]:
            user = {"residence_status": loan_recommend.RESIDENCE_STATUSES[0], "purpose": purpose, "visit": visit}
            results[result_key(user)] = loan_recommend.recommend(user, products=products, top_n=EXPORT_TOP_N)
    months = sorted({r["base_month"] for r in results.values() if r["base_month"]})
    payload = {
        "product": "loan",
        "mode": "fast",
        "generated_on": f"{date.today():%Y-%m-%d}",
        "base_month": months[-1] if months else "",
        "key_order": KEY_ORDER,
        "choices": loan_recommend.CHOICES,
        "top_n": EXPORT_TOP_N,
        "results": results,
    }
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return out_path, len(results)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    out = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    path, count = export(out)
    print(f"대출 fast 결과 {count}가지 저장: {path} ({path.stat().st_size / 1024:.0f}KB)")


if __name__ == "__main__":
    main()
