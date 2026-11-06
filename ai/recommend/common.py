import csv
import itertools
import json
from collections import Counter
from datetime import date
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = AI_DIR / "data" / "raw"
PROCESSED_DIR = AI_DIR / "data" / "processed"
MODELS_DIR = AI_DIR / "models"
SERVING_DIR = AI_DIR.parent / "backend" / "src" / "main" / "resources" / "recommend"
ENV_PATH = AI_DIR / ".env"

RESIDENCE_STATUSES = [
    "비전문취업(E-9)", "방문취업(H-2)", "전문인력", "유학생", "재외동포(F-4)", "영주(F-5)", "결혼이민(F-6)", "기타",
]
EXPORT_TOP_N = 20


def today():
    return f"{date.today():%Y%m%d}"


def latest(directory, pattern):
    files = sorted(Path(directory).glob(pattern))
    if not files:
        raise FileNotFoundError(f"{directory}에 {pattern} 파일이 없습니다")
    return files[-1]


def date_of(path):
    return Path(path).stem.rsplit("_", 1)[-1]


def read_env(name):
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            if key.strip() == name:
                return value.strip()
    raise SystemExit(f"ai/.env에 {name}가 없습니다")


def load_finlife(service, group):
    data = json.loads(latest(RAW_DIR, f"finlife_{service}_{group}_*.json").read_text(encoding="utf-8"))
    return data["baseList"], data["optionList"]


def read_csv(path):
    with Path(path).open(encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def write_csv(rows, path, columns):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
    return path


def validate(user, choices, numbers=(), ranges=(), residence=False):
    errors = {}
    values = {}
    for name, allowed in choices.items():
        value = user.get(name)
        if name in numbers:
            try:
                value = int(value)
            except (TypeError, ValueError):
                value = None
        if value not in allowed:
            errors[name] = [allowed[0], allowed[-1]] if name in ranges else allowed
        values[name] = value
    if residence and user.get("residence_status") not in RESIDENCE_STATUSES:
        errors["residence_status"] = RESIDENCE_STATUSES
    if errors:
        raise ValueError(errors)
    return {**user, **{name: values[name] for name in numbers}}


def one_per_company(results, name_key):
    leaders, more = [], {}
    for r in results:
        name = r[name_key]
        if name in more:
            more[name] += 1
        else:
            more[name] = 0
            leaders.append(r)
    return leaders, more


def result_key(user, key_order):
    return "|".join(str(user[name]) for name in key_order)


def export_results(product, choices, recommend_one, out_path, date_field="base_month", extra=None,
                   shown_choices=None, top_n=EXPORT_TOP_N):
    results = {}
    for values in itertools.product(*choices.values()):
        user = dict(zip(choices, values))
        results[result_key(user, choices)] = recommend_one(user)
    dates = sorted({r[date_field] for r in results.values() if r[date_field]})
    payload = {
        "product": product,
        "mode": "fast",
        "generated_on": f"{date.today():%Y-%m-%d}",
        date_field: dates[-1] if dates else "",
        **(extra or {}),
        "key_order": list(choices),
        "choices": shown_choices or choices,
        "top_n": top_n,
        "results": results,
    }
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return out_path, len(results)


def print_export(label, path, count):
    print(f"{label} 결과 {count}가지 저장: {path} ({path.stat().st_size / 1024:.0f}KB)")


def print_summary(title, results, describe, per_group=5):
    print(f"\n## {title}")
    shown = Counter()
    for r in results:
        if shown[r["group"]] >= per_group:
            continue
        shown[r["group"]] += 1
        print(f"  [{r['group']}] {describe(r)}")
    print("  그룹별 개수:", dict(Counter(r["group"] for r in results)))
