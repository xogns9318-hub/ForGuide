import importlib.util
import json
import sys
from datetime import date
from pathlib import Path

INSURANCE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INSURANCE_DIR.parent))
sys.path.insert(0, str(INSURANCE_DIR))

from baseline import GATE_PASS, load_rows

spec = importlib.util.spec_from_file_location("insurance_recommend", INSURANCE_DIR / "recommend.py")
insurance_recommend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(insurance_recommend)

AI_DIR = INSURANCE_DIR.parent.parent
DEFAULT_OUT = AI_DIR.parent / "backend" / "src" / "main" / "resources" / "recommend" / "insurance_fast.json"
EXPORT_TOP_N = 20
KEY_ORDER = ["sex", "age", "coverage"]


def result_key(user):
    return "|".join(str(user[name]) for name in KEY_ORDER)


def export(out_path=DEFAULT_OUT):
    rows = load_rows()
    choices = insurance_recommend.CHOICES
    results = {}
    for sex in choices["sex"]:
        for age in choices["age"]:
            for coverage in choices["coverage"]:
                user = {"health_insurance": GATE_PASS, "residence_status": insurance_recommend.RESIDENCE_STATUSES[0],
                        "sex": sex, "age": age, "coverage": coverage}
                result = insurance_recommend.recommend(user, rows=rows, top_n=EXPORT_TOP_N)
                results[result_key(user)] = result
    dates = sorted({r["base_date"] for r in results.values() if r["base_date"]})
    payload = {
        "product": "insurance",
        "mode": "fast",
        "generated_on": f"{date.today():%Y-%m-%d}",
        "base_date": dates[-1] if dates else "",
        "gate": {"health_insurance": GATE_PASS, "otherwise": insurance_recommend.REDIRECT},
        "key_order": KEY_ORDER,
        "choices": {"sex": choices["sex"], "age": [choices["age"][0], choices["age"][-1]], "coverage": choices["coverage"]},
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
    print(f"보험 fast 결과 {count}가지 저장: {path} ({path.stat().st_size / 1024:.0f}KB)")


if __name__ == "__main__":
    main()
