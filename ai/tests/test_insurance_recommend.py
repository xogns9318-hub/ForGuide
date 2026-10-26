import importlib.util
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent.parent
INSURANCE_DIR = AI_DIR / "recommend" / "insurance"
KO_JS = AI_DIR.parent / "frontend" / "src" / "i18n" / "locales" / "ko.js"


def load_insurance_modules():
    saved = {name: sys.modules.pop(name) for name in ("baseline", "recommend", "export_results") if name in sys.modules}
    saved_path = list(sys.path)
    sys.path.insert(0, str(INSURANCE_DIR))
    sys.path.insert(0, str(AI_DIR / "recommend"))
    try:
        modules = {}
        for name in ("baseline", "recommend", "export_results"):
            spec = importlib.util.spec_from_file_location(name, INSURANCE_DIR / f"{name}.py")
            module = importlib.util.module_from_spec(spec)
            sys.modules[name] = module
            spec.loader.exec_module(module)
            modules[name] = module
        return modules
    finally:
        sys.path[:] = saved_path
        for name in ("baseline", "recommend", "export_results"):
            sys.modules.pop(name, None)
        sys.modules.update(saved)


MODULES = load_insurance_modules()
baseline = MODULES["baseline"]
recommend_module = MODULES["recommend"]
export_module = MODULES["export_results"]


def row(company, product, premium, age=30, product_type="일반", direct="0", insurer="손해보험"):
    return {
        "insurer_type": insurer, "cmpy_cd": company, "cmpy_nm": company, "prd_nm": product,
        "product_type": product_type, "is_direct": direct, "age": str(age),
        "male_basic": str(premium // 2), "male_rider1": "0", "male_rider2": str(premium - premium // 2), "male_total": str(premium),
        "female_basic": str(premium // 2), "female_rider1": "0", "female_rider2": str(premium - premium // 2), "female_total": str(premium),
        "homepage": "", "phone": "", "bas_dt": "20260901",
    }


FIXTURE = [
    row("가손보", "가실손", 9000),
    row("가손보", "가실손 다이렉트", 8000, direct="1"),
    row("나생명", "나실손", 12000, insurer="생명보험"),
    row("다손보", "다실손", 20000),
    row("가손보", "가노후실손", 15000, product_type="노후"),
    row("라손보", "라유병력자실손", 18000, product_type="유병력자"),
    row("가손보", "가실손", 30000, age=50),
]
USER = {"health_insurance": "예", "residence_status": "유학생", "sex": "남", "age": 30, "coverage": "비급여까지"}


class InsuranceTest(unittest.TestCase):
    def run_fixture(self, **changes):
        return recommend_module.recommend({**USER, **changes}, rows=FIXTURE)

    def test_gate_redirects_to_consultation(self):
        for answer in ("아니오", "모름", None):
            self.assertEqual(self.run_fixture(health_insurance=answer)["redirect"], "consultation")

    def test_sorted_by_premium_one_card_per_company(self):
        items = self.run_fixture()["groups"][0]["items"]
        self.assertEqual([i["monthly_premium"] for i in items], [8000, 12000, 20000])
        self.assertEqual(items[0]["more_from_company"], 1)
        self.assertTrue(all("score" not in i for i in items))

    def test_only_same_age_general_products_are_compared(self):
        group = self.run_fixture()["groups"][0]
        self.assertEqual(group["total"], 4)
        self.assertEqual(group["key"], "check")

    def test_senior_and_simplified_are_separate(self):
        separate = {s["key"]: s for s in self.run_fixture()["separate"]}
        self.assertEqual(set(separate), {"senior", "simplified"})
        self.assertEqual(separate["senior"]["items"][0]["monthly_premium"], 15000)
        self.assertEqual(self.run_fixture(age=50)["separate"], [])

    def test_reasons_and_check(self):
        items = self.run_fixture()["groups"][0]["items"]
        self.assertEqual(items[0]["reasons"], ["low_premium", "online_join"])
        self.assertEqual(items[2]["reasons"], [])
        self.assertTrue(all(i["check_reasons"] == ["insurer_review"] for i in items))

    def test_basic_coverage_compares_basic_premium_only(self):
        result = self.run_fixture(coverage="기본형만")
        items = result["groups"][0]["items"]
        self.assertEqual([i["monthly_premium"] for i in items], [4000, 6000, 10000])
        self.assertTrue(all("premium_breakdown" not in i for i in items))
        self.assertEqual(result["input"]["coverage"], "기본형만")
        self.assertIn("premium_breakdown", self.run_fixture()["groups"][0]["items"][0])

    def test_validation(self):
        with self.assertRaises(ValueError) as caught:
            recommend_module.validate({"sex": "x", "age": 10, "residence_status": "관광"})
        self.assertEqual(set(caught.exception.args[0]), {"sex", "age", "coverage", "residence_status"})
        self.assertEqual(recommend_module.validate({**USER, "age": "45"})["age"], 45)

    def test_every_key_has_korean_text(self):
        text = KO_JS.read_text(encoding="utf-8")
        block = text[text.index("recommendResult:"):]
        defined = set(re.findall(r"^\s+([a-z_]+):", block, re.MULTILINE))
        used = {"low_premium", "online_join", "insurer_review", "ask_insurer_eligibility", "senior", "simplified",
                "premium_may_change", "insurance_age_basis", "reference_only", "check"}
        self.assertEqual(used - defined, set())


@unittest.skipUnless(list(baseline.PROCESSED_DIR.glob("insurance_*.csv")), "정제 데이터 없음")
class InsuranceRealDataTest(unittest.TestCase):
    def test_export_covers_every_input_and_compares_same_coverage(self):
        with tempfile.TemporaryDirectory() as folder:
            path, count = export_module.export(Path(folder) / "insurance_fast.json")
            payload = json.loads(path.read_text(encoding="utf-8"))
        choices = recommend_module.CHOICES
        self.assertEqual(count, len(choices["sex"]) * len(choices["age"]) * len(choices["coverage"]))
        for key, result in payload["results"].items():
            items = result["groups"][0]["items"]
            premiums = [i["monthly_premium"] for i in items]
            with self.subTest(key=key):
                self.assertEqual(premiums, sorted(premiums))
                self.assertEqual(len({i["company"] for i in items}), len(items))


if __name__ == "__main__":
    unittest.main()
