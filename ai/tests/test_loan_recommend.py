import importlib.util
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
LOAN_DIR = AI_DIR / "recommend" / "loan"
KO_JS = AI_DIR.parent / "frontend" / "src" / "i18n" / "locales" / "ko.js"
NAMES = ("baseline", "recommend", "export_results")


def load_loan_modules():
    saved = {name: sys.modules.pop(name) for name in NAMES if name in sys.modules}
    saved_path = list(sys.path)
    sys.path.insert(0, str(LOAN_DIR))
    sys.path.insert(0, str(AI_DIR / "recommend"))
    try:
        modules = {}
        for name in NAMES:
            spec = importlib.util.spec_from_file_location(name, LOAN_DIR / f"{name}.py")
            module = importlib.util.module_from_spec(spec)
            sys.modules[name] = module
            spec.loader.exec_module(module)
            modules[name] = module
        return modules
    finally:
        sys.path[:] = saved_path
        for name in NAMES:
            sys.modules.pop(name, None)
        sys.modules.update(saved)


MODULES = load_loan_modules()
baseline = MODULES["baseline"]
recommend_module = MODULES["recommend"]
export_module = MODULES["export_results"]


sys.path.insert(0, str(AI_DIR / "preprocessing"))
from clean_finlife_loans import is_rate_inconsistent, is_visit_required  # noqa: E402
sys.path.remove(str(AI_DIR / "preprocessing"))


def product(code, company, rate, loan_type="신용대출", institution="은행", foreigner="확인 필요", note="",
            target="0", visit="0", inconsistent="0"):
    return {
        "loan_type": loan_type, "fin_co_no": company, "kor_co_nm": company, "institution_type": institution,
        "fin_prdt_cd": code, "fin_prdt_nm": f"상품{code}", "product_kind": "일반신용대출" if loan_type == "신용대출" else "전세자금대출",
        "foreigner_status": foreigner, "foreigner_note": note, "target_limited": target,
        "join_way": "영업점" if visit == "1" else "인터넷", "visit_required": visit,
        "rate_avg": "" if rate is None else str(rate), "rate_min": "" if rate is None else str(rate - 1),
        "rate_max": "" if rate is None else str(rate + 3), "rate_inconsistent": inconsistent,
        "loan_limit_text": "", "repay_types": "", "rate_types": "",
        "homepage": "", "phone": "", "dcls_month": "202609",
    }


FIXTURE = [
    product("C1", "가은행", 5.0),
    product("C2", "가은행", 5.2),
    product("C3", "나저축은행", 12.0, institution="저축은행", visit="1"),
    product("C4", "다은행", None),
    product("C5", "주식회사 케이뱅크", 4.0, foreigner="불일치", note="kbank_not_yet"),
    product("J1", "라은행", 3.5, loan_type="전세자금대출", target="1"),
    product("J2", "마은행", 4.0, loan_type="전세자금대출"),
    product("J3", "바은행", 3.0, loan_type="전세자금대출", inconsistent="1"),
]
USER = {"residence_status": "유학생", "purpose": "생활비", "visit": "상관없음"}


class LoanTest(unittest.TestCase):
    def run_fixture(self, **changes):
        return recommend_module.recommend({**USER, **changes}, products=FIXTURE)

    def test_purpose_selects_loan_type(self):
        self.assertEqual(self.run_fixture()["loan_type"], "credit")
        self.assertEqual(self.run_fixture(purpose="전세 보증금")["loan_type"], "jeonse")

    def test_sorted_by_average_rate_and_undisclosed_last(self):
        items = self.run_fixture()["groups"][0]["items"]
        self.assertEqual([i["company"] for i in items], ["가은행", "나저축은행", "다은행"])
        self.assertEqual(items[0]["more_from_company"], 1)
        self.assertIn("rate_not_disclosed", items[-1]["check_reasons"])

    def test_override_goes_to_mismatch(self):
        result = self.run_fixture()
        self.assertEqual(result["mismatch"]["total"], 1)
        self.assertEqual(result["mismatch"]["items"][0]["mismatch_reasons"], ["kbank_not_yet"])
        self.assertNotIn("주식회사 케이뱅크", [i["company"] for i in result["groups"][0]["items"]])

    def test_target_limited_product_goes_last(self):
        items = self.run_fixture(purpose="전세 보증금")["groups"][0]["items"]
        self.assertEqual(items[0]["company"], "마은행")
        self.assertEqual({i["company"] for i in items[1:]}, {"라은행", "바은행"})
        self.assertIn("special_target", next(i for i in items if i["company"] == "라은행")["check_reasons"])

    def test_rate_inconsistent_goes_last_with_reason(self):
        items = self.run_fixture(purpose="전세 보증금")["groups"][0]["items"]
        flagged = next(i for i in items if i["company"] == "바은행")
        self.assertIn("rate_inconsistent", flagged["check_reasons"])
        self.assertNotEqual(items[0]["company"], "바은행")

    def test_cleaning_rules(self):
        self.assertEqual(is_visit_required("영업점"), 1)
        self.assertEqual(is_visit_required("영업점,모집인"), 1)
        self.assertEqual(is_visit_required("영업점,스마트폰,모집인"), 0)
        self.assertEqual(is_visit_required("모집인,전화(텔레뱅킹)"), 0)
        self.assertEqual(is_visit_required(""), 0)
        self.assertEqual(is_rate_inconsistent({"rate_avg": "11.73", "rate_min": "5.89", "rate_max": "6.59"}), 1)
        self.assertEqual(is_rate_inconsistent({"rate_avg": "4.39", "rate_min": "4.94", "rate_max": "6.24"}), 0)
        self.assertEqual(is_rate_inconsistent({"rate_avg": "", "rate_min": "4", "rate_max": "5"}), 0)

    def test_every_card_says_limit_after_review(self):
        for item in self.run_fixture()["groups"][0]["items"]:
            self.assertIn("limit_after_review", item["check_reasons"])

    def test_reasons(self):
        items = self.run_fixture()["groups"][0]["items"]
        self.assertEqual(items[0]["reasons"], ["low_rate", "bank", "no_visit"])
        self.assertEqual(items[1]["reasons"], [])

    def test_visit_not_wanted_moves_branch_only_to_mismatch(self):
        result = self.run_fixture(visit="원치 않음")
        self.assertNotIn("나저축은행", [i["company"] for i in result["groups"][0]["items"]])
        reasons = {i["company"]: i["mismatch_reasons"] for i in result["mismatch"]["items"]}
        self.assertEqual(reasons["나저축은행"], ["visit_required"])
        self.assertTrue(all("no_visit" not in i["reasons"] for i in result["groups"][0]["items"]))
        self.assertEqual(result["input"]["visit"], "원치 않음")

    def test_validation(self):
        with self.assertRaises(ValueError) as caught:
            recommend_module.validate({"residence_status": "관광", "purpose": "기타"})
        self.assertEqual(set(caught.exception.args[0]), {"purpose", "visit", "residence_status"})

    def test_every_key_has_korean_text(self):
        text = KO_JS.read_text(encoding="utf-8")
        block = text[text.index("recommendResult:"):]
        defined = set(re.findall(r"^\s+([a-z_]+):", block, re.MULTILINE))
        used = {"low_rate", "bank", "no_visit", "foreigner_unspecified", "kakao_withdrawal_only", "limit_after_review",
                "special_target", "rate_not_disclosed", "kbank_not_yet", "ask_loan_eligibility", "rate_by_credit",
                "rate_may_change", "reference_only", "check", "mismatch", "visit_required", "rate_inconsistent"}
        self.assertEqual(used - defined, set())


@unittest.skipUnless(list(baseline.PROCESSED_DIR.glob("finlife_loans_*.csv")), "정제 데이터 없음")
class LoanRealDataTest(unittest.TestCase):
    def test_export_covers_every_purpose(self):
        with tempfile.TemporaryDirectory() as folder:
            path, count = export_module.export(Path(folder) / "loan_fast.json")
            payload = json.loads(path.read_text(encoding="utf-8"))
        choices = recommend_module.CHOICES
        self.assertEqual(set(payload["results"]), {f"{p}|{v}" for p in choices["purpose"] for v in choices["visit"]})
        for key, result in payload["results"].items():
            items = result["groups"][0]["items"]
            last = {"special_target", "rate_inconsistent"}
            rates = [i["rate_avg"] for i in items if i["rate_avg"] is not None and not last & set(i["check_reasons"])]
            with self.subTest(key=key):
                self.assertEqual(rates, sorted(rates))
                companies = [i["company"] for i in items]
                self.assertNotIn("(주)케이뱅크", companies)
                self.assertTrue(all("주식회사" not in c for c in companies))


if __name__ == "__main__":
    unittest.main()
