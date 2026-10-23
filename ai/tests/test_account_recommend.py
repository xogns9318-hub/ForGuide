import itertools
import re
import sys
import unittest
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(AI_DIR / "recommend" / "account"))
sys.path.insert(0, str(AI_DIR / "recommend"))
sys.path.insert(0, str(AI_DIR / "preprocessing"))

from engine import GROUP_CHECK, GROUP_MATCH, GROUP_MISMATCH, compare_features
from baseline import PROCESSED_DIR, WEIGHTS, load_options, recommend_fast
from clean_finlife_savings import classify_foreigner
from pairs import eval_split, pair_key
from recommend import CHOICES, recommend, validate

KO_JS = AI_DIR.parent / "frontend" / "src" / "i18n" / "locales" / "ko.js"
ALL_USERS = [dict(zip(CHOICES, values)) for values in itertools.product(*CHOICES.values())]


def option(code, company="가저축은행", institution="저축은행", rate=3.0, foreigner="확인 필요",
           visit="0", region="", outlier="0", note="", purpose="예금", term=12):
    return {
        "fin_co_no": company, "fin_prdt_cd": code, "kor_co_nm": company, "fin_prdt_nm": f"상품{code}",
        "institution_type": institution, "purpose": purpose, "save_trm": str(term),
        "intr_rate": str(rate), "intr_rate_type": "S", "effective_rate": str(rate),
        "foreigner_status": foreigner, "foreigner_note": note, "visit_required": visit,
        "region_limit": region, "rate_outlier": outlier, "join_way": "영업점" if visit == "1" else "인터넷",
        "homepage": "", "phone": "", "dcls_month": "202609",
    }


FIXTURE = [
    option("M1", company="부합저축은행", rate=3.5, foreigner="부합"),
    option("M2", company="부합저축은행", rate=3.4, foreigner="부합"),
    option("V1", company="방문저축은행", rate=3.9, visit="1"),
    option("D1", company="내국인저축은행", rate=4.0, foreigner="불일치"),
    option("B1", company="가은행", institution="은행", rate=3.2),
    option("R1", company="지역저축은행", rate=3.8, visit="1", region="진주,통영"),
    option("O1", company="튀는저축은행", rate=6.0, outlier="1"),
    option("K1", company="주식회사 케이뱅크", institution="은행", rate=3.6, foreigner="불일치", note="kbank_not_yet"),
    option("S1", company="적금저축은행", rate=5.0, purpose="적금"),
]


def shown_items(result):
    return [item for group in result["groups"] for item in group["items"]]


class EligibilityTest(unittest.TestCase):
    def run_fast(self, visit="상관없음", institution="상관없음"):
        user = {"purpose": "예금", "term": 12, "visit": visit, "institution": institution}
        _, results = recommend_fast(FIXTURE, user, WEIGHTS)
        return {r["product_id"].split("-")[1]: r for r in results}

    def test_visit_not_wanted_blocks_branch_only(self):
        results = self.run_fast(visit="원치 않음")
        self.assertEqual(results["V1"]["group"], GROUP_MISMATCH)
        self.assertIn("visit_required", results["V1"]["mismatch_reasons"])

    def test_visit_allowed_keeps_branch_only(self):
        self.assertEqual(self.run_fast()["V1"]["group"], GROUP_CHECK)

    def test_domestic_only_and_override_are_mismatch(self):
        results = self.run_fast()
        self.assertEqual(results["D1"]["mismatch_reasons"], ["domestic_only"])
        self.assertEqual(results["K1"]["mismatch_reasons"], ["kbank_not_yet"])

    def test_match_group_needs_explicit_foreigner_permission(self):
        for r in self.run_fast().values():
            if r["group"] == GROUP_MATCH:
                self.assertEqual(r["check_reasons"], [])
                self.assertTrue(r["product_id"].endswith(("M1", "M2")))

    def test_other_purpose_and_term_are_not_candidates(self):
        self.assertNotIn("S1", self.run_fast())

    def test_region_and_outlier_go_to_bottom_of_check_group(self):
        results = self.run_fast()
        check_order = [code for code, r in results.items() if r["group"] == GROUP_CHECK]
        self.assertEqual(set(check_order[-2:]), {"R1", "O1"})
        self.assertIn("rate_outlier", results["O1"]["check_reasons"])
        self.assertIn("region_limit", results["R1"]["check_reasons"])

    def test_bank_is_favored_by_savings_bank_feature(self):
        results = self.run_fast(institution="은행 선호")
        self.assertEqual(results["B1"]["features"]["savings_bank"], 0)
        self.assertEqual(results["B1"]["features"]["non_preferred_institution"], 0)
        self.assertEqual(results["V1"]["features"]["non_preferred_institution"], 1)


class OutputTest(unittest.TestCase):
    def test_validate_reports_allowed_values(self):
        with self.assertRaises(ValueError) as caught:
            validate({"purpose": "예금", "term": 5, "visit": "몰라요", "institution": "상관없음"})
        self.assertEqual(set(caught.exception.args[0]), {"term", "visit"})

    def test_term_accepts_string_number(self):
        self.assertEqual(validate({"purpose": "적금", "term": "24", "visit": "상관없음", "institution": "상관없음"})["term"], 24)

    def test_result_shape_and_one_card_per_company(self):
        result = recommend({"purpose": "예금", "term": 12, "visit": "상관없음", "institution": "상관없음"},
                           options=FIXTURE, weights=WEIGHTS)
        self.assertEqual(set(result), {"mode", "input", "base_month", "weights", "groups", "mismatch", "notices"})
        self.assertEqual([g["key"] for g in result["groups"]], ["match", "check"])
        match = result["groups"][0]
        self.assertEqual(match["total"], 2)
        self.assertEqual(match["companies"], 1)
        self.assertEqual(match["items"][0]["more_from_company"], 1)
        for group in result["groups"]:
            names = [item["company"] for item in group["items"]]
            self.assertEqual(len(names), len(set(names)))
        self.assertNotIn("score", shown_items(result)[0])

    def test_no_visit_reason_hidden_when_visit_not_wanted(self):
        result = recommend({"purpose": "예금", "term": 12, "visit": "원치 않음", "institution": "상관없음"},
                           options=FIXTURE, weights=WEIGHTS)
        for item in shown_items(result):
            self.assertNotIn("no_visit", item["reasons"])

    def test_every_key_has_korean_text(self):
        text = KO_JS.read_text(encoding="utf-8")
        block = text[text.index("recommendResult:"):]
        defined = set(re.findall(r"^\s+([a-z_]+):", block, re.MULTILINE))
        used = {"high_rate", "no_visit", "bank", "match", "check", "mismatch", "join_at_company", "ask_foreigner_eligibility",
                "rate_may_change", "savings_bank_protected", "reference_only", "foreigner_unspecified", "region_limit",
                "rate_outlier", "kakao_withdrawal_only", "domestic_only", "visit_required", "kbank_not_yet"}
        self.assertEqual(used - defined, set())


class PairTest(unittest.TestCase):
    def test_pair_key_ignores_order_and_split_is_stable(self):
        context = {"purpose": "예금", "save_trm": 12, "visit": "상관없음", "institution": "상관없음"}
        key = pair_key(context, "b-2", "a-1")
        self.assertEqual(key, pair_key(context, "a-1", "b-2"))
        self.assertTrue(key.endswith("a-1|b-2"))
        self.assertEqual(eval_split(key), eval_split(key))

    def test_compare_features(self):
        directions = {"rate": 1, "visit_required": -1}
        self.assertEqual(compare_features({"rate": 1, "visit_required": 0}, {"rate": 0.5, "visit_required": 0}, directions), "A")
        self.assertIsNone(compare_features({"rate": 1, "visit_required": 1}, {"rate": 0.5, "visit_required": 0}, directions))
        self.assertEqual(compare_features({"rate": 1, "visit_required": 0}, {"rate": 1, "visit_required": 0}, directions), "같음")


class OverrideTest(unittest.TestCase):
    def test_overrides_win_over_disclosure_text(self):
        self.assertEqual(classify_foreigner("내·외국인 대상", "주식회사 케이뱅크"), ("불일치", "kbank_not_yet"))
        self.assertEqual(classify_foreigner("실명의 개인", "주식회사 카카오뱅크"), ("확인 필요", "kakao_withdrawal_only"))
        self.assertEqual(classify_foreigner("비거주 외국인 외 제한없음"), ("부합", ""))
        self.assertEqual(classify_foreigner("내국인만 가입 가능"), ("불일치", ""))


@unittest.skipUnless(list(PROCESSED_DIR.glob("finlife_savings_*.csv")), "정제 데이터 없음")
class RealDataTest(unittest.TestCase):
    def test_no_ineligible_product_is_recommended(self):
        options = load_options()
        by_id = {(o["purpose"], f"{o['fin_co_no']}-{o['fin_prdt_cd']}"): o for o in options}
        checked = 0
        for user in ALL_USERS:
            _, results = recommend_fast(options, validate(user), WEIGHTS)
            for r in results:
                if r["group"] == GROUP_MISMATCH:
                    continue
                product = by_id[(user["purpose"], r["product_id"])]
                checked += 1
                with self.subTest(user=user, product=r["product_id"]):
                    self.assertNotEqual(product["foreigner_status"], "불일치")
                    self.assertEqual(product["purpose"], user["purpose"])
                    self.assertEqual(r["save_trm"], user["term"])
                    if user["visit"] == "원치 않음":
                        self.assertEqual(product["visit_required"], "0")
                    if r["group"] == GROUP_MATCH:
                        self.assertEqual(product["foreigner_status"], "부합")
        self.assertGreater(checked, 1000)

    def test_export_covers_every_input(self):
        import json
        import tempfile
        from export_results import export, result_key

        with tempfile.TemporaryDirectory() as folder:
            path, count = export(Path(folder) / "account_fast.json")
            payload = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(count, len(ALL_USERS))
        self.assertEqual(set(payload["results"]), {result_key(u) for u in ALL_USERS})
        self.assertEqual(payload["key_order"], list(CHOICES))


if __name__ == "__main__":
    unittest.main()
