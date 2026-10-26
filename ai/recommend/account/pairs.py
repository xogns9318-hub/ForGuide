import csv
import hashlib
import random
import sys
from collections import defaultdict
from datetime import date
from itertools import combinations
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from engine import GROUP_MISMATCH, compare_features
from baseline import load_options, recommend_fast

AI_DIR = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = AI_DIR / "data" / "processed"

SEED = 20261019
DIRECTIONS = {"rate": 1, "check_count": -1, "visit_required": -1, "non_preferred_institution": -1}
FEATURE_LABELS = {
    "rate": "금리",
    "check_count": "확인 필요",
    "visit_required": "방문",
    "non_preferred_institution": "비선호 금융기관",
}
AUTO_PAIRS_PER_GROUP = 50
JUDGE_PAIRS_PER_GROUP = 3
RATE_GAP_BINS = [0.2, 0.4, 0.6, 0.8, 1.0]
MAX_APPEARANCE = 2
EVAL_RATIO = 0.3

CONTEXT_FIELDS = ["purpose", "save_trm", "visit", "institution"]
SIDE_FIELDS = [
    "product_id", "kor_co_nm", "fin_prdt_nm", "institution_type", "effective_rate",
    "rate", "check_count", "visit_required", "non_preferred_institution", "baseline",
]
PAIR_COLUMNS = (
    ["pair_id", "pair_key", "context_id"] + CONTEXT_FIELDS + ["user_count", "weight_sum", "group", "tradeoff"]
    + [f"a_{name}" for name in SIDE_FIELDS]
    + [f"b_{name}" for name in SIDE_FIELDS]
    + ["source", "split", "judge", "label"]
)


def load_users(path=None):
    if path is None:
        path = sorted(PROCESSED_DIR.glob("virtual_users_*.csv"))[-1]
    with Path(path).open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def build_contexts(users):
    contexts = {}
    for user in users:
        key = (user["account_purpose"], int(user["account_term"]), user["visit"], user["institution"])
        if key not in contexts:
            contexts[key] = dict(zip(CONTEXT_FIELDS, key), user_count=0, weight_sum=0.0)
        contexts[key]["user_count"] += 1
        contexts[key]["weight_sum"] += float(user["eval_weight"])
    ordered = sorted(contexts.values(), key=lambda c: tuple(c[name] for name in CONTEXT_FIELDS))
    for index, context in enumerate(ordered, start=1):
        context["context_id"] = f"C{index:02d}"
    return ordered


def candidates_by_group(options, context):
    user = {
        "purpose": context["purpose"],
        "term": context["save_trm"],
        "visit": context["visit"],
        "institution": context["institution"],
    }
    _, results = recommend_fast(options, user)
    groups = defaultdict(list)
    for r in results:
        if r["group"] != GROUP_MISMATCH and not r["sort_last"]:
            groups[r["group"]].append(r)
    return groups


def side_values(result):
    values = {name: result[name] for name in ["product_id", "kor_co_nm", "fin_prdt_nm", "institution_type", "effective_rate"]}
    values.update(result["features"])
    values["baseline"] = round(result["score"], 4)
    return values


def tradeoff_kind(a, b):
    changed = [FEATURE_LABELS[name] for name in DIRECTIONS if a["features"][name] != b["features"][name]]
    return "·".join(changed)


def pair_key(context, a_id, b_id):
    first, second = sorted([a_id, b_id])
    return "|".join([str(context[name]) for name in CONTEXT_FIELDS] + [first, second])


def eval_split(key):
    bucket = int(hashlib.md5(key.encode("utf-8")).hexdigest(), 16) % 100
    return "eval" if bucket < EVAL_RATIO * 100 else "train"


def make_row(context, group, a, b, source, label, rng=None):
    if rng is not None and rng.random() < 0.5:
        a, b = b, a
        label = {"A": "B", "B": "A"}.get(label, label)
    row = {name: context.get(name, "") for name in ["context_id"] + CONTEXT_FIELDS + ["user_count"]}
    row["pair_key"] = pair_key(context, a["product_id"], b["product_id"])
    row["weight_sum"] = round(context.get("weight_sum", 0.0), 4)
    row["group"] = group
    row["tradeoff"] = tradeoff_kind(a, b)
    for prefix, side in (("a", a), ("b", b)):
        for name, value in side_values(side).items():
            row[f"{prefix}_{name}"] = value
    row.update({"source": source, "split": "", "judge": "", "label": label})
    return row


def split_pairs(group_results):
    dominated, tradeoffs = [], []
    for a, b in combinations(group_results, 2):
        outcome = compare_features(a["features"], b["features"], DIRECTIONS)
        if outcome is None:
            tradeoffs.append((a, b))
        elif outcome != "같음":
            dominated.append((a, b, outcome))
    return dominated, tradeoffs


def feature_signature(a, b):
    sides = sorted(tuple(r["features"][name] for name in DIRECTIONS) for r in (a, b))
    return tuple(sides)


def rate_gap_bin(a, b):
    gap = abs(a["effective_rate"] - b["effective_rate"])
    for index, upper in enumerate(RATE_GAP_BINS):
        if gap < upper:
            return index
    return len(RATE_GAP_BINS)


def pick_tradeoffs(tradeoffs, limit):
    ordered = sorted(tradeoffs, key=lambda pair: abs(pair[0]["score"] - pair[1]["score"]))
    by_bin = defaultdict(list)
    for a, b in ordered:
        by_bin[rate_gap_bin(a, b)].append((a, b))
    appearance = defaultdict(int)
    seen = set()
    picked = []
    while len(picked) < limit and any(by_bin.values()):
        for index in sorted(by_bin):
            while by_bin[index]:
                a, b = by_bin[index].pop(0)
                if appearance[a["product_id"]] >= MAX_APPEARANCE or appearance[b["product_id"]] >= MAX_APPEARANCE:
                    continue
                signature = feature_signature(a, b)
                if signature in seen:
                    continue
                seen.add(signature)
                picked.append((a, b))
                appearance[a["product_id"]] += 1
                appearance[b["product_id"]] += 1
                break
            if len(picked) >= limit:
                break
    return picked


def build_pairs(options, contexts, rng):
    auto_rows, judge_rows, stats = [], [], []
    for context in contexts:
        for group, group_results in sorted(candidates_by_group(options, context).items()):
            dominated, tradeoffs = split_pairs(group_results)
            sampled = rng.sample(dominated, min(len(dominated), AUTO_PAIRS_PER_GROUP))
            auto_rows += [make_row(context, group, a, b, "auto", label, rng) for a, b, label in sampled]
            picked = pick_tradeoffs(tradeoffs, JUDGE_PAIRS_PER_GROUP)
            judge_rows += [make_row(context, group, a, b, "human", "", rng) for a, b in picked]
            stats.append((context["context_id"], group, len(group_results), len(dominated), len(tradeoffs), len(picked)))
    return auto_rows, judge_rows, stats


def assign_splits(auto_rows, judge_rows):
    for row in auto_rows:
        row["split"] = "train"
    for row in judge_rows:
        row["split"] = eval_split(row["pair_key"])


def parse_key(key):
    values = key.split("|")
    context = dict(zip(CONTEXT_FIELDS, values[:len(CONTEXT_FIELDS)]))
    context["save_trm"] = int(context["save_trm"])
    return context, values[len(CONTEXT_FIELDS):]


def labeled_rows(options, labels):
    cache = {}
    rows, missing = [], []
    for key, winner in labels.items():
        context, product_ids = parse_key(key)
        context_key = tuple(context[name] for name in CONTEXT_FIELDS)
        if context_key not in cache:
            cache[context_key] = candidates_by_group(options, context)
        found = None
        for group, group_results in cache[context_key].items():
            by_id = {r["product_id"]: r for r in group_results}
            if all(pid in by_id for pid in product_ids):
                found = (group, by_id[product_ids[0]], by_id[product_ids[1]])
        if found is None:
            missing.append(key)
            continue
        group, a, b = found
        label = "A" if winner == a["product_id"] else "B" if winner == b["product_id"] else "같음"
        row = make_row(context, group, a, b, "human", label)
        row["split"] = eval_split(key)
        rows.append(row)
    return rows, missing


def save_rows(rows, prefix, path):
    for index, row in enumerate(rows, start=1):
        row["pair_id"] = f"{prefix}{index:04d}"
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=PAIR_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    rng = random.Random(SEED)
    options = load_options()
    contexts = build_contexts(load_users())
    auto_rows, judge_rows, stats = build_pairs(options, contexts, rng)
    assign_splits(auto_rows, judge_rows)
    today = f"{date.today():%Y%m%d}"
    auto_path = PROCESSED_DIR / f"account_pairs_auto_{today}.csv"
    judge_path = PROCESSED_DIR / f"account_pairs_judge_{today}.csv"
    save_rows(auto_rows, "AA", auto_path)
    save_rows(judge_rows, "AH", judge_path)

    for c in contexts:
        print(f"{c['context_id']} {c['purpose']} {c['save_trm']}개월, 방문 {c['visit']}, 금융기관 {c['institution']}: 사용자 {c['user_count']}명")
    print("\n맥락 | 그룹 | 후보 | 우열 쌍 | 장단점 쌍 | 판정 후보")
    for row in stats:
        print(" | ".join(str(v) for v in row))
    print(f"\n자동 라벨 {len(auto_rows)}쌍 저장: {auto_path}")
    print(f"사람 판정 {len(judge_rows)}쌍 저장: {judge_path}")


if __name__ == "__main__":
    main()
