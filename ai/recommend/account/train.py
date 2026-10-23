import csv
import json
import sys
from datetime import date
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from baseline import WEIGHTS, load_options
from pairs import labeled_rows

ACCOUNT_DIR = Path(__file__).resolve().parent
AI_DIR = ACCOUNT_DIR.parent.parent
PROCESSED_DIR = AI_DIR / "data" / "processed"
MODELS_DIR = AI_DIR / "models"
LABELS_PATH = ACCOUNT_DIR / "labels.json"
WEIGHTS_PATH = MODELS_DIR / "account_fast_weights.json"

FEATURES = list(WEIGHTS)
HUMAN_WEIGHT = 5.0
C = 1.0


def load_labels(path=LABELS_PATH):
    by_judge = json.loads(Path(path).read_text(encoding="utf-8"))
    merged = {}
    for labels in by_judge.values():
        merged.update(labels)
    return by_judge, merged


def load_auto_pairs():
    path = sorted(PROCESSED_DIR.glob("account_pairs_auto_*.csv"))[-1]
    with path.open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f)), path.stem.rsplit("_", 1)[-1]


def diff_matrix(rows):
    return np.array([[float(r[f"a_{n}"]) - float(r[f"b_{n}"]) for n in FEATURES] for r in rows])


def targets(rows):
    return np.array([1 if r["label"] == "A" else 0 for r in rows])


def fit(auto_rows, human_rows):
    rows = auto_rows + human_rows
    sample_weight = np.array([HUMAN_WEIGHT if r["source"] == "human" else 1.0 for r in rows])
    model = LogisticRegression(fit_intercept=False, C=C)
    model.fit(diff_matrix(rows), targets(rows), sample_weight=sample_weight)
    return model


def accuracy(rows, scores_a, scores_b):
    if not rows:
        return None
    hits = [(a > b and r["label"] == "A") or (a < b and r["label"] == "B") for r, a, b in zip(rows, scores_a, scores_b)]
    return round(sum(hits) / len(rows), 4)


def score(rows, prefix, weights):
    return [sum(weights[n] * float(r[f"{prefix}_{n}"]) for n in FEATURES) for r in rows]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    by_judge, labels = load_labels()
    human, missing = labeled_rows(load_options(), labels)
    human = [r for r in human if r["label"] in ("A", "B")]
    auto, pair_date = load_auto_pairs()
    train_rows = [r for r in human if r["split"] == "train"]
    eval_rows = [r for r in human if r["split"] == "eval"]

    model = fit(auto, train_rows)
    coef = dict(zip(FEATURES, model.coef_[0]))
    scale = WEIGHTS["rate"] / coef["rate"]
    learned = {n: round(coef[n] * scale, 4) for n in FEATURES}

    result = {
        "trained_on": f"{date.today():%Y-%m-%d}",
        "pair_date": pair_date,
        "human_weight": HUMAN_WEIGHT,
        "judges": sorted(by_judge),
        "auto_pairs": len(auto),
        "human_train": len(train_rows),
        "human_eval": len(eval_rows),
        "missing_labels": len(missing),
        "eval_accuracy": {
            "baseline": accuracy(eval_rows, score(eval_rows, "a", WEIGHTS), score(eval_rows, "b", WEIGHTS)),
            "learned": accuracy(eval_rows, score(eval_rows, "a", learned), score(eval_rows, "b", learned)),
        },
        "weights": learned,
    }
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    WEIGHTS_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=1))
    print(f"저장: {WEIGHTS_PATH}")


if __name__ == "__main__":
    main()
