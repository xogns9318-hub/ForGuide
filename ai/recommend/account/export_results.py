import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import EXPORT_TOP_N, SERVING_DIR, export_results, print_export
from baseline import load_options
from recommend import CHOICES, load_weights, recommend

DEFAULT_OUT = SERVING_DIR / "account_fast.json"
EXPORT_MISMATCH_N = 3


def export(out_path=DEFAULT_OUT):
    options = load_options()
    weights, source = load_weights()
    return export_results(
        "account", CHOICES,
        lambda user: recommend(user, options=options, weights=weights, top_n=EXPORT_TOP_N, mismatch_n=EXPORT_MISMATCH_N),
        out_path, extra={"weights": source},
    )


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print_export("계좌 빠른 추천", *export())


if __name__ == "__main__":
    main()
