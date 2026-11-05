import json
import sys
from collections import Counter
from itertools import combinations
from pathlib import Path

ACCOUNT_DIR = Path(__file__).resolve().parent
HUMAN_PATH = ACCOUNT_DIR / "labels.json"
AI_PATH = ACCOUNT_DIR / "ai_labels.json"


def load_judges(*paths):
    judges = {}
    for path in paths:
        if Path(path).exists():
            judges.update(json.loads(Path(path).read_text(encoding="utf-8")))
    return judges


def answer(key, entry):
    winner = entry["winner"] if isinstance(entry, dict) else entry
    first, second = key.split("|")[4:6]
    return "A" if winner == first else "B" if winner == second else "같음"


def cohen_kappa(left, right):
    total = len(left)
    if total == 0:
        return None
    observed = sum(a == b for a, b in zip(left, right)) / total
    left_counts, right_counts = Counter(left), Counter(right)
    expected = sum(left_counts[c] * right_counts[c] for c in left_counts) / total ** 2
    if expected == 1:
        return 1.0 if observed == 1 else 0.0
    return (observed - expected) / (1 - expected)


def agreement(judges):
    rows = []
    for one, other in combinations(judges, 2):
        keys = sorted(set(judges[one]) & set(judges[other]))
        left = [answer(k, judges[one][k]) for k in keys]
        right = [answer(k, judges[other][k]) for k in keys]
        same = sum(a == b for a, b in zip(left, right))
        rows.append({
            "pair": (one, other),
            "count": len(keys),
            "agree": round(same / len(keys), 3) if keys else None,
            "kappa": None if not keys else round(cohen_kappa(left, right), 3),
        })
    return rows


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    judges = load_judges(HUMAN_PATH, AI_PATH)
    print("판정자:", ", ".join(f"{name}({len(labels)})" for name, labels in judges.items()))
    print("\n판정자 A | 판정자 B | 함께 판정한 쌍 | 일치율 | 카파")
    for row in agreement(judges):
        print(f"{row['pair'][0]} | {row['pair'][1]} | {row['count']} | {row['agree']} | {row['kappa']}")


if __name__ == "__main__":
    main()
