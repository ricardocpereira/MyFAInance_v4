import importlib
import os
import sys
import tempfile
import unittest


class HoldingsPriceRefreshTest(unittest.TestCase):
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

    def test_auto_fetches_price_when_cache_missing(self) -> None:
        xtb_items = [
            self.main.XtbImportItem(
                filename="xtb.xlsx",
                file_hash="xtb-hash",
                account_type="Broker",
                category="Stocks",
                current_value=1000.0,
                cash_value=0.0,
                invested=800.0,
                profit_value=50.0,
                profit_percent=None,
            )
        ]
        saved_xtb = self.main._save_xtb_imports(self.portfolio_id, xtb_items)
        with self.main._db_connection() as conn:
            for item in saved_xtb:
                conn.execute(
                    "UPDATE xtb_imports SET imported_at = ? WHERE id = ?",
                    (self.snapshot_date, item["id"]),
                )

        holding_import = self.main._save_holdings_import(
            self.portfolio_id,
            "XTB",
            "xtb.xlsx",
            "holdings-hash",
            self.snapshot_date,
        )
        self.main._save_holdings_items(
            holding_import["id"],
            [
                self.main.HoldingImportItem(
                    source_file="xtb.xlsx",
                    ticker="AAPL",
                    name="Apple",
                    shares=2,
                    open_price=10.0,
                    current_price=None,
                    purchase_value=20.0,
                    category="Stocks",
                )
            ],
        )

        old_key = self.main.PRICE_API_KEY
        old_fetch = self.main._fetch_latest_price
        self.main.PRICE_API_KEY = "test-key"
        self.main._fetch_latest_price = lambda _ticker: 25.0
        try:
            holdings = self.main._list_holdings_for_portfolio(
                self.portfolio_id, self.settings_lookup
            )
        finally:
            self.main.PRICE_API_KEY = old_key
            self.main._fetch_latest_price = old_fetch

        self.assertEqual(len(holdings["items"]), 1)
        item = holdings["items"][0]
        self.assertAlmostEqual(item["current_price"], 25.0, places=4)
        self.assertAlmostEqual(item["current_value"], 50.0, places=2)
        self.assertAlmostEqual(item["cost_basis"], 20.0, places=2)


if __name__ == "__main__":
    unittest.main()
