import importlib
import os
import sys
import tempfile
import unittest


class HistoryAggregationTest(unittest.TestCase):
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

    def test_history_aggregates_totals_and_categories(self) -> None:
        items = [
            self.main.SantanderItem(
                section="Contas",
                account="Conta Ordenado",
                description="Cash account",
                balance=1000.0,
                category="Cash",
            ),
            self.main.SantanderItem(
                section="Poupancas",
                account="Emergency",
                description="Emergency fund",
                balance=2000.0,
                category="Emergency Funds",
                invested=1500.0,
                gains=100.0,
            ),
        ]
        result = self.main._save_santander_import(
            self.portfolio_id, "santander.xlsx", items
        )
        with self.main._db_connection() as conn:
            conn.execute(
                "UPDATE santander_imports SET imported_at = ? WHERE id = ?",
                (self.snapshot_date, result["import_id"]),
            )

        self.main._save_trade_republic_entry(
            self.portfolio_id,
            {
                "available_cash": 500.0,
                "interests_received": 0.0,
                "invested": 400.0,
                "value": 500.0,
                "gains": 20.0,
                "currency": "EUR",
                "category": "Cash",
                "source": "manual",
                "source_file": None,
                "file_hash": "trade-hash",
                "snapshot_date": self.snapshot_date,
            },
        )

        save_payload = self.main.SaveNGrowCommitRequest(
            filename="save.xlsx",
            file_hash="save-hash",
            snapshot_date=self.snapshot_date,
            items=[],
        )
        save_totals = {
            "invested_total": 2500.0,
            "current_value_total": 3000.0,
            "profit_value_total": 200.0,
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
                    invested=2500.0,
                    current_value=3000.0,
                    profit_value=200.0,
                    profit_percent=None,
                    category="Retirement Plans",
                )
            ],
        )

        aforronet_payload = self.main.AforroNetCommitRequest(
            filename="aforronet.pdf",
            file_hash="aforronet-hash",
            snapshot_date=self.snapshot_date,
            items=[],
        )
        aforronet_totals = {"invested_total": 800.0, "current_value_total": 800.0}
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
                    current_value=800.0,
                    category="Emergency Funds",
                )
            ],
        )

        bancoinvest_payload = self.main.BancoInvestCommitRequest(
            filename="bancoinvest.xlsx",
            file_hash="bancoinvest-hash",
            snapshot_date=self.snapshot_date,
            items=[],
        )
        bancoinvest_import = self.main._save_bancoinvest_import(
            self.portfolio_id, bancoinvest_payload
        )
        self.main._save_bancoinvest_items(
            bancoinvest_import["id"],
            [
                self.main.BancoInvestItem(
                    holder="Beni",
                    invested=600.0,
                    current_value=600.0,
                    gains=50.0,
                    category="Retirement Plans",
                )
            ],
        )

        xtb_items = [
            self.main.XtbImportItem(
                filename="xtb.xlsx",
                file_hash="xtb-hash",
                account_type="Broker",
                category="Stocks",
                current_value=1500.0,
                cash_value=0.0,
                invested=1200.0,
                profit_value=100.0,
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

        history = self.main._list_portfolio_history(
            self.portfolio_id, self.settings_lookup
        )
        self.assertEqual(len(history), 1)
        row = history[0]
        self.assertEqual(row["date"], self.snapshot_date[:10])
        self.assertAlmostEqual(row["total"], 9400.0, places=2)
        self.assertAlmostEqual(row["cash"], 1500.0, places=2)
        self.assertAlmostEqual(row["emergency"], 2800.0, places=2)
        self.assertAlmostEqual(row["invested"], 6600.0, places=2)


if __name__ == "__main__":
    unittest.main()
