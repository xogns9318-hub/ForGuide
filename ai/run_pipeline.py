import argparse
import subprocess
import sys
import time
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent
PRE = AI_DIR / "preprocessing"
REC = AI_DIR / "recommend"

COLLECT = [
    ("수집: 금융상품한눈에", PRE / "collect_finlife.py"),
    ("수집: 실손보험정보", PRE / "collect_insurance.py"),
]
STEPS = [
    ("정제: 예·적금", PRE / "clean_finlife_savings.py"),
    ("정제: 대출", PRE / "clean_finlife_loans.py"),
    ("정제: 실손보험", PRE / "clean_insurance.py"),
    ("가상 사용자", PRE / "build_virtual_users.py"),
    ("비교 쌍", REC / "account" / "pairs.py"),
    ("학습", REC / "account" / "train.py"),
    ("결과 내보내기: 계좌", REC / "account" / "export_results.py"),
    ("결과 내보내기: 보험", REC / "insurance" / "export_results.py"),
    ("결과 내보내기: 대출", REC / "loan" / "export_results.py"),
    ("판정 페이지", REC / "account" / "judge_page.py"),
]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="추천 AI 전체 파이프라인: 수집 → 정제 → 가상 사용자 → 비교 쌍 → 학습 → 결과 내보내기")
    parser.add_argument("--skip-collect", action="store_true", help="수집을 건너뛰고 가장 최신 원본으로 정제부터 실행")
    args = parser.parse_args()

    steps = STEPS if args.skip_collect else COLLECT + STEPS
    started = time.time()
    for number, (name, script) in enumerate(steps, start=1):
        print(f"\n[{number}/{len(steps)}] {name}", flush=True)
        result = subprocess.run([sys.executable, str(script)], cwd=AI_DIR.parent)
        if result.returncode != 0:
            print(f"\n중단: [{number}/{len(steps)}] {name} 단계에서 실패했습니다 (종료 코드 {result.returncode}, {script.name})")
            sys.exit(result.returncode)
    print(f"\n완료: {len(steps)}단계, {time.time() - started:.0f}초")


if __name__ == "__main__":
    main()
