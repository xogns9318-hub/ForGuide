import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import PROCESSED_DIR, read_csv
from pairs import snapshot_entry

LABELS_PATH = Path(__file__).resolve().parent / "labels.json"
HEADER = re.compile(r"판정자:\s*([^,]+),\s*쌍\s*(\d{8})")
ANSWER = re.compile(r"(AH\d{4})\s*=\s*(A|B|같음)")


def parse(text):
    header = HEADER.search(text)
    if not header:
        raise SystemExit("판정 페이지의 '판정 복사' 결과를 그대로 넣어 주세요 (판정자·쌍 날짜가 필요합니다)")
    return header.group(1).strip(), header.group(2), dict(ANSWER.findall(text))


def merge(text, path=LABELS_PATH):
    judge, pair_date, answers = parse(text)
    rows = {r["pair_id"]: r for r in read_csv(PROCESSED_DIR / f"account_pairs_judge_{pair_date}.csv")}
    unknown = [pair_id for pair_id in answers if pair_id not in rows]
    if unknown:
        raise SystemExit(f"쌍 {pair_date} 파일에 없는 번호: {', '.join(unknown)}")
    labels = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    judge_labels = labels.setdefault(judge, {})
    for pair_id, answer in answers.items():
        row = rows[pair_id]
        winner = row["a_product_id"] if answer == "A" else row["b_product_id"] if answer == "B" else "같음"
        judge_labels[row["pair_key"]] = snapshot_entry(row, winner, pair_date)
    path.write_text(json.dumps(labels, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return judge, pair_date, len(answers), len(judge_labels)


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    text = " ".join(sys.argv[1:]) or sys.stdin.read()
    judge, pair_date, added, total = merge(text)
    print(f"판정자 {judge}: 쌍 {pair_date}에서 {added}개 저장 (전체 {total}개)")


if __name__ == "__main__":
    main()
