import json
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = AI_DIR / "data" / "raw"
ENV_PATH = AI_DIR / ".env"

BASE_URL = "http://finlife.fss.or.kr/finlifeapi/{service}.json"
GROUPS = ["020000", "030300"]
SERVICE_GROUPS = {"companySearch": ["020000", "030300", "050000"]}


def read_key():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.lstrip().startswith("#"):
            key, value = line.split("=", 1)
            if key.strip() == "FINALIFE_KEY":
                return value.strip()
    raise SystemExit("ai/.env에 FINALIFE_KEY가 없습니다")


def fetch_page(service, group, page, auth):
    query = urllib.parse.urlencode({"auth": auth, "topFinGrpNo": group, "pageNo": page})
    with urllib.request.urlopen(f"{BASE_URL.format(service=service)}?{query}", timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))["result"]


def fetch_all(service, group, auth):
    first = fetch_page(service, group, 1, auth)
    if first.get("err_cd") != "000":
        raise SystemExit(f"{service} {group} 실패: {first.get('err_cd')} {first.get('err_msg')}")
    base, options = list(first.get("baseList", [])), list(first.get("optionList", []))
    for page in range(2, int(first.get("max_page_no", 1)) + 1):
        result = fetch_page(service, group, page, auth)
        base += result.get("baseList", [])
        options += result.get("optionList", [])
    return {"baseList": base, "optionList": options}


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    service = sys.argv[1] if len(sys.argv) > 1 else "companySearch"
    auth = read_key()
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    today = f"{date.today():%Y%m%d}"
    for group in SERVICE_GROUPS.get(service, GROUPS):
        data = fetch_all(service, group, auth)
        path = RAW_DIR / f"finlife_{service}_{group}_{today}.json"
        path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        print(f"{service} {group}: 기본 {len(data['baseList'])}건, 옵션 {len(data['optionList'])}건 → {path.name}")


if __name__ == "__main__":
    main()
