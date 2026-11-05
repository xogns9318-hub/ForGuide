import importlib.util
import sys
from pathlib import Path

LOAN_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LOAN_DIR.parent))
sys.path.insert(0, str(LOAN_DIR))

from common import EXPORT_TOP_N, RESIDENCE_STATUSES, SERVING_DIR, export_results, print_export
from baseline import load_products

spec = importlib.util.spec_from_file_location("loan_recommend", LOAN_DIR / "recommend.py")
loan_recommend = importlib.util.module_from_spec(spec)
spec.loader.exec_module(loan_recommend)

DEFAULT_OUT = SERVING_DIR / "loan_fast.json"


def export(out_path=DEFAULT_OUT):
    products = load_products()
    return export_results(
        "loan", loan_recommend.CHOICES,
        lambda user: loan_recommend.recommend(
            {"residence_status": RESIDENCE_STATUSES[0], **user}, products=products, top_n=EXPORT_TOP_N),
        out_path,
    )


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print_export("대출 빠른 추천", *export())


if __name__ == "__main__":
    main()
