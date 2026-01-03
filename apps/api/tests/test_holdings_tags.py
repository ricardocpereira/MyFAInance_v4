import importlib
import os
import sys
import tempfile
import unittest

from fastapi import HTTPException


class HoldingsTagsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        os.environ["DB_PATH"] = os.path.join(self.tempdir.name, "test.db")
        sys.path.insert(
            0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        )
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
        self.snapshot_date = "2025-01-10T10:00:00"

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def _seed_holdings(self) -> None:
        holding_import = self.main._save_holdings_import(
            self.portfolio_id,
            "XTB",
            "xtb.xlsx",
            "holdings-tags-hash",
            self.snapshot_date,
        )
        self.main._save_holdings_items(
            holding_import["id"],
            [
                self.main.HoldingImportItem(
                    source_file="xtb.xlsx",
                    ticker="VUSA",
                    name="Vanguard S&P 500 ETF",
                    shares=2,
                    open_price=100.0,
                    current_price=120.0,
                    purchase_value=200.0,
                    category="Stocks",
                )
            ],
        )

    def test_auto_tags_can_be_suppressed(self) -> None:
        self._seed_holdings()
        holdings = self.main._list_holdings_for_portfolio(
            self.portfolio_id, self.settings_lookup
        )
        self.assertIn("ETF", holdings["items"][0]["tags"])

        self.main._set_holding_tags(self.portfolio_id, "VUSA", [])
        holdings_again = self.main._list_holdings_for_portfolio(
            self.portfolio_id, self.settings_lookup
        )
        self.assertNotIn("ETF", holdings_again["items"][0]["tags"])

    def test_custom_tag_unique(self) -> None:
        self.main._save_investment_tag("user@example.com", "Custom Tag")
        with self.assertRaises(HTTPException):
            self.main._save_investment_tag("user@example.com", "custom tag")


if __name__ == "__main__":
    unittest.main()
