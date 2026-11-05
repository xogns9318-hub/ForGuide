import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "recommend"))

from common import RAW_DIR, read_env, today

BASE_URL = "http://finlife.fss.or.kr/finlifeapi/{service}.json"
GROUPS = ["020000", "030300"]
SERVICES = {
    "depositProductsSearch": GROUPS,
    "savingProductsSearch": GROUPS,
    "creditLoanProductsSearch": GROUPS,
    "rentHouseLoanProductsSearch": GROUPS,
    "companySearch": ["020000", "030300", "050000"],
}


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
    services = sys.argv[1:] or list(SERVICES)
    auth = read_env("FINALIFE_KEY")
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for service in services:
        for group in SERVICES.get(service, GROUPS):
            data = fetch_all(service, group, auth)
            path = RAW_DIR / f"finlife_{service}_{group}_{today()}.json"
            path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            print(f"{service} {group}: 기본 {len(data['baseList'])}건, 옵션 {len(data['optionList'])}건 → {path.name}")


if __name__ == "__main__":
    main()
