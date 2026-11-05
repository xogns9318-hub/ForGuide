import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "recommend"))

from common import RAW_DIR, read_env, today

BASE_URL = "https://apis.data.go.kr/1160100/service/GetMedicalReimbursementInsuranceInfoService/getInsuranceInfo"
BEGIN_MONTH = (2025, 1)
ROWS_PER_PAGE = 300
RETRIES = 3


def request(url, page):
    for attempt in range(1, RETRIES + 1):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                return response.read().decode("utf-8")
        except urllib.error.HTTPError as error:
            if error.code < 500 or attempt == RETRIES:
                raise SystemExit(f"실손보험정보 {page}쪽 HTTP {error.code} {error.reason}")
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == RETRIES:
                raise SystemExit(f"실손보험정보 {page}쪽 연결 실패: {getattr(error, 'reason', error)}")
        time.sleep(2 * attempt)


def fetch_page(page, key, begin, end):
    query = urllib.parse.urlencode({
        "serviceKey": key, "pageNo": page, "numOfRows": ROWS_PER_PAGE,
        "resultType": "json", "beginBasDt": begin, "endBasDt": end,
    })
    body = request(f"{BASE_URL}?{query}", page)
    try:
        data = json.loads(body)["response"]
    except (ValueError, KeyError):
        raise SystemExit(f"실손보험정보 {page}쪽 응답을 읽지 못했습니다: {body[:200]}")
    if data["header"]["resultCode"] != "00":
        raise SystemExit(f"실손보험정보 실패: {data['header']['resultCode']} {data['header']['resultMsg']}")
    return data["body"]


def items_of(body):
    items = (body.get("items") or {}).get("item") or []
    return items if isinstance(items, list) else [items]


def months(until=None):
    until = until or date.today()
    year, month = BEGIN_MONTH
    while (year, month) <= (until.year, until.month):
        following = (year + 1, 1) if month == 12 else (year, month + 1)
        yield f"{year}{month:02d}01", f"{following[0]}{following[1]:02d}01"
        year, month = following


def fetch_window(key, begin, end):
    first = fetch_page(1, key, begin, end)
    records = items_of(first)
    pages = -(-int(first["totalCount"]) // ROWS_PER_PAGE)
    for page in range(2, pages + 1):
        records += items_of(fetch_page(page, key, begin, end))
    return records


def fetch_all(key):
    records = []
    for begin, end in months():
        window = fetch_window(key, begin, end)
        records += window
        if window:
            print(f"  {begin[:6]}: {len(window):,}건", flush=True)
    return records


def latest_by_company(records):
    newest = {}
    for r in records:
        newest[r["cmpyNm"]] = max(newest.get(r["cmpyNm"], ""), r["basDt"])
    return [r for r in records if r["basDt"] == newest[r["cmpyNm"]]]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    records = fetch_all(read_env("AII_KEY"))
    latest = latest_by_company(records)
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    all_path = RAW_DIR / f"insurance_all_2025on_{today()}.json"
    latest_path = RAW_DIR / f"insurance_latest_by_company_{today()}.json"
    all_path.write_text(json.dumps(records, ensure_ascii=False), encoding="utf-8")
    latest_path.write_text(json.dumps(latest, ensure_ascii=False), encoding="utf-8")
    print(f"실손보험정보 {len(records):,}건 → {all_path.name}")
    print(f"보험사별 최신 기준일 {len(latest):,}건 → {latest_path.name}")


if __name__ == "__main__":
    main()
