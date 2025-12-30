import os
import sys
import tempfile
import importlib
import unittest


class SummaryAggregationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        os.environ["DB_PATH"] = os.path.join(self.tempdir.name, "test.db")
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        import app.main as main

        self.main = importlib.reload(main)
        self.main._init_db()
        portfolio = self.main._create_portfolio(
            "user@example.com",
            "Test Portfolio",
            "EUR",
            ["Cash", "Emergency Funds", "Retirement Plans", "Stocks"],
        )
        self.portfolio_id = portfolio["id"]
        settings = self.main._get_category_settings(self.portfolio_id)
        self.settings_lookup = {
            self.main._normalize_text(key): value for key, value in settings.items()
        }

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def _seed_aforronet_and_save(self) -> None:
        aforronet_payload = self.main.AforroNetCommitRequest(
            filename="aforronet.pdf",
            file_hash="aforronet-hash",
            snapshot_date="2025-01-10",
            items=[],
        )
        aforronet_totals = {"invested_total": 800.0, "current_value_total": 1000.0}
        aforronet_import = self.main._save_aforronet_import(
            self.portfolio_id,
            aforronet_payload,
            aforronet_totals,
            "EUR",
            "Emergency Funds",
        )
        self.main._save_aforronet_items(
            aforronet_import["id"],
            [
                self.main.AforroNetItem(
                    name="AforroNet",
                    invested=800.0,
                    current_value=1000.0,
                    category="Emergency Funds",
                )
            ],
        )

        save_payload = self.main.SaveNGrowCommitRequest(
            filename="save.xlsx",
            file_hash="save-hash",
            snapshot_date="2025-02-10",
            items=[],
        )
        save_totals = {
            "invested_total": 2000.0,
            "current_value_total": 2300.0,
            "profit_value_total": 300.0,
            "profit_percent_total": None,
        }
        save_import = self.main._save_savengrow_import(
            self.portfolio_id, save_payload, save_totals, "EUR"
        )
        self.main._save_savengrow_items(
            save_import["id"],
            [
                self.main.SaveNGrowItem(
                    name="Save N Grow",
                    invested=2000.0,
                    current_value=2300.0,
                    profit_value=300.0,
                    profit_percent=None,
                    category="Retirement Plans",
                )
            ],
        )

    def test_latest_totals_include_multiple_imports(self) -> None:
        self._seed_aforronet_and_save()
        totals, total_invested, total_profit, _, _ = self.main._aggregate_latest_totals(
            self.portfolio_id, self.settings_lookup
        )
        self.assertAlmostEqual(totals.get("Emergency Funds", 0), 1000.0, places=2)
        self.assertAlmostEqual(totals.get("Retirement Plans", 0), 2300.0, places=2)
        self.assertAlmostEqual(total_invested, 2800.0, places=2)
        self.assertAlmostEqual(total_profit, 500.0, places=2)

    def test_institutions_include_latest_imports(self) -> None:
        self._seed_aforronet_and_save()
        rows = self.main._list_institutions(self.portfolio_id, self.settings_lookup)
        names = {row["institution"] for row in rows}
        self.assertIn("AforroNet", names)
        self.assertIn("Save N Grow", names)
        aforronet_row = next(row for row in rows if row["institution"] == "AforroNet")
        self.assertAlmostEqual(aforronet_row["total"], 1000.0, places=2)
        self.assertAlmostEqual(aforronet_row["gains"], 200.0, places=2)

    def test_cash_profit_counts_as_investment(self) -> None:
        entry = self.main._build_trade_republic_entry(
            1000.0,
            100.0,
            "EUR",
            category="Cash",
            source="manual",
        )
        self.main._save_trade_republic_entry(self.portfolio_id, entry)
        totals, total_invested, total_profit, investment_total, cash_investment = (
            self.main._aggregate_latest_totals(self.portfolio_id, self.settings_lookup)
        )
        self.assertTrue(cash_investment)
        self.assertAlmostEqual(totals.get("Cash", 0), 1000.0, places=2)
        self.assertAlmostEqual(total_invested, 900.0, places=2)
        self.assertAlmostEqual(total_profit, 100.0, places=2)
        self.assertAlmostEqual(investment_total, 1000.0, places=2)


if __name__ == "__main__":
    unittest.main()
