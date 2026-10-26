import csv
import io
import random
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = AI_DIR / "data" / "processed"
ENV_PATH = AI_DIR / ".env"

SOURCE_PREFIX = "2025_공통항목"
WEIGHT_COLUMN = "공통항목_가중값"
SEED = 20261016
USER_COUNT = 60
MIN_PER_STATUS = 5

RESIDENCE_STATUS = {
    "1": "비전문취업(E-9)",
    "2": "방문취업(H-2)",
    "3": "전문인력",
    "4": "유학생",
    "5": "재외동포(F-4)",
    "6": "영주(F-5)",
    "7": "결혼이민(F-6)",
    "8": "기타",
}
INCOME = {
    "1": "없음",
    "2": "100만 원 미만",
    "3": "100~200만 원",
    "4": "200~300만 원",
    "5": "300만 원 이상",
}
AGE_BAND = {
    "20": ("15~29세", 19, 29),
    "30": ("30~39세", 30, 39),
    "40": ("40~49세", 40, 49),
    "50": ("50~59세", 50, 59),
    "60": ("60세 이상", 60, 70),
}
SEX = {"1": "남", "2": "여"}

ASSUMED_CHOICES = {
    "account_purpose": ["예금", "적금"],
    "account_term": [6, 12, 24, 36],
    "institution": ["은행 선호", "상관없음"],
    "visit": ["상관없음", "원치 않음"],
    "loan_purpose": ["생활비", "주거(전세)", "기타"],
}

DISTRIBUTION_FIELDS = ["residence_status", "income", "age_band", "sex"]
USER_COLUMNS = [
    "user_id",
    "residence_status",
    "income",
    "age_band",
    "age",
    "sex",
    "account_purpose",
    "account_term",
    "institution",
    "visit",
    "health_insurance",
    "loan_purpose",
    "eval_weight",
]


def read_env():
    env = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


def load_respondents():
    mdis_dir = Path(read_env()["MDIS_DIR"])
    path = next(mdis_dir.glob(f"{SOURCE_PREFIX}*.csv"))
    text = path.read_bytes().decode("cp949")
    respondents = []
    for row in csv.DictReader(io.StringIO(text)):
        status = RESIDENCE_STATUS.get(row["현재체류자격_재분류코드"].strip())
        income = INCOME.get(row["월평균총소득_구간코드"].strip())
        age = AGE_BAND.get(row["연령계층코드"].strip())
        sex = SEX.get(row["성별코드"].strip())
        if not (status and income and age and sex):
            continue
        respondents.append({
            "residence_status": status,
            "income": income,
            "age_band": age[0],
            "age_range": (age[1], age[2]),
            "sex": sex,
            "weight": float(row[WEIGHT_COLUMN]),
        })
    return respondents


def weighted_distribution(respondents, field):
    totals = defaultdict(float)
    for r in respondents:
        totals[r[field]] += r["weight"]
    whole = sum(totals.values())
    return {key: value / whole for key, value in sorted(totals.items(), key=lambda kv: -kv[1])}


def weighted_pick(group, count, rng):
    return rng.choices(group, weights=[r["weight"] for r in group], k=count)


def pick_respondents(respondents, count, min_per_status, rng):
    by_status = defaultdict(list)
    for r in respondents:
        by_status[r["residence_status"]].append(r)
    picked = []
    for status in sorted(by_status):
        picked += weighted_pick(by_status[status], min_per_status, rng)
    remaining = count - len(picked)
    if remaining > 0:
        picked += weighted_pick(respondents, remaining, rng)
    return picked


def evaluation_weights(respondents, picked):
    population = weighted_distribution(respondents, "residence_status")
    sample_counts = defaultdict(int)
    for r in picked:
        sample_counts[r["residence_status"]] += 1
    return {
        status: population[status] / (sample_counts[status] / len(picked))
        for status in sample_counts
    }


def sample_users(respondents, count, rng):
    picked = pick_respondents(respondents, count, MIN_PER_STATUS, rng)
    weights = evaluation_weights(respondents, picked)
    users = []
    for index, r in enumerate(picked, start=1):
        low, high = r["age_range"]
        users.append({
            "user_id": f"VU{index:03d}",
            "residence_status": r["residence_status"],
            "income": r["income"],
            "age_band": r["age_band"],
            "age": rng.randint(low, high),
            "sex": r["sex"],
            "account_purpose": rng.choice(ASSUMED_CHOICES["account_purpose"]),
            "account_term": rng.choice(ASSUMED_CHOICES["account_term"]),
            "institution": rng.choice(ASSUMED_CHOICES["institution"]),
            "visit": rng.choice(ASSUMED_CHOICES["visit"]),
            "health_insurance": "예",
            "loan_purpose": rng.choice(ASSUMED_CHOICES["loan_purpose"]),
            "eval_weight": round(weights[r["residence_status"]], 4),
        })
    return users


def save_distribution(respondents, path):
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["field", "value", "weighted_share"])
        for field in DISTRIBUTION_FIELDS:
            for value, share in weighted_distribution(respondents, field).items():
                writer.writerow([field, value, round(share, 4)])


def save_users(users, path):
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=USER_COLUMNS)
        writer.writeheader()
        writer.writerows(users)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    respondents = load_respondents()
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    today = f"{date.today():%Y%m%d}"
    distribution_path = PROCESSED_DIR / f"mdis_distribution_{today}.csv"
    users_path = PROCESSED_DIR / f"virtual_users_{today}.csv"
    save_distribution(respondents, distribution_path)
    users = sample_users(respondents, USER_COUNT, random.Random(SEED))
    save_users(users, users_path)
    print(f"외국인 응답자 {len(respondents):,}명 기준 분포 저장: {distribution_path}")
    print(f"가상 사용자 {len(users)}명 저장: {users_path}")


if __name__ == "__main__":
    main()
