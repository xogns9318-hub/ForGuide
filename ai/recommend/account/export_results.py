import itertools
import json
import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from baseline import load_options
from recommend import CHOICES, load_weights, recommend

AI_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_OUT = AI_DIR.parent / "backend" / "src" / "main" / "resources" / "recommend" / "account_fast.json"
EXPORT_TOP_N = 20
EXPORT_MISMATCH_N = 3


def result_key(user):
    return "|".join(str(user[name]) for name in CHOICES)


def export(out_path=DEFAULT_OUT):
    options = load_options()
    weights, source = load_weights()
    results = {}
    for values in itertools.product(*CHOICES.values()):
        user = dict(zip(CHOICES, values))
        results[result_key(user)] = recommend(user, options=options, weights=weights,
                                              top_n=EXPORT_TOP_N, mismatch_n=EXPORT_MISMATCH_N)
    months = sorted({r["base_month"] for r in results.values() if r["base_month"]})
    payload = {
        "product": "account",
        "mode": "fast",
        "generated_on": f"{date.today():%Y-%m-%d}",
        "base_month": months[-1] if months else "",
        "weights": source,
        "key_order": list(CHOICES),
        "choices": CHOICES,
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
    print(f"계좌 fast 결과 {count}가지 저장: {path} ({path.stat().st_size / 1024:.0f}KB)")


if __name__ == "__main__":
    main()
