import importlib.util
import sys
from pathlib import Path

INSURANCE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(INSURANCE_DIR.parent))
sys.path.insert(0, str(INSURANCE_DIR))

from common import EXPORT_TOP_N, RESIDENCE_STATUSES, SERVING_DIR, export_results, print_export
from baseline import GATE_PASS, load_rows

spec = importlib.util.spec_from_file_location("insurance_recommend", INSURANCE_DIR / "recommend.py")
insurance_recommend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(insurance_recommend)

DEFAULT_OUT = SERVING_DIR / "insurance_fast.json"


def export(out_path=DEFAULT_OUT):
    rows = load_rows()
    choices = insurance_recommend.CHOICES
    fixed = {"health_insurance": GATE_PASS, "residence_status": RESIDENCE_STATUSES[0]}
    return export_results(
        "insurance", choices,
        lambda user: insurance_recommend.recommend({**fixed, **user}, rows=rows, top_n=EXPORT_TOP_N),
        out_path, date_field="base_date",
        extra={"gate": {"health_insurance": GATE_PASS, "otherwise": insurance_recommend.REDIRECT}},
        shown_choices={"sex": choices["sex"], "age": [choices["age"][0], choices["age"][-1]]},
    )


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print_export("보험 빠른 추천", *export())


if __name__ == "__main__":
    main()
