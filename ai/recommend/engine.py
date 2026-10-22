GROUP_MATCH = "부합"
GROUP_CHECK = "확인 필요"
GROUP_MISMATCH = "불일치"
GROUP_ORDER = {GROUP_MATCH: 0, GROUP_CHECK: 1, GROUP_MISMATCH: 2}


def absolute_score(best, value, full_gap):
    if value is None or best is None:
        return 0.0
    return max(0.0, min(1.0, 1 - (best - value) / full_gap))


def decide_group(mismatch_reasons, check_reasons):
    if mismatch_reasons:
        return GROUP_MISMATCH
    if check_reasons:
        return GROUP_CHECK
    return GROUP_MATCH


def weighted_score(features, weights):
    contributions = {name: weights[name] * value for name, value in features.items()}
    return sum(contributions.values()), contributions


def top_reasons(contributions, limit=3):
    ordered = sorted(contributions.items(), key=lambda item: abs(item[1]), reverse=True)
    return [name for name, value in ordered if value != 0][:limit]


def compare_features(a, b, directions):
    a_better = b_better = False
    for name, direction in directions.items():
        diff = (a[name] - b[name]) * direction
        if diff > 0:
            a_better = True
        elif diff < 0:
            b_better = True
    if a_better and b_better:
        return None
    if a_better:
        return "A"
    if b_better:
        return "B"
    return "같음"


def sort_results(results):
    return sorted(
        results,
        key=lambda r: (
            GROUP_ORDER[r["group"]],
            r.get("sort_last", False),
            -(r["score"] if r["score"] is not None else float("-inf")),
            -r.get("tiebreak", 0),
        ),
    )
