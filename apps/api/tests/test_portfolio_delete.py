import importlib
import os
import sys
import tempfile
import unittest
from datetime import datetime


class PortfolioDeleteTest(unittest.TestCase):
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
            "Delete Portfolio",
            "EUR",
            ["Cash", "Emergency Funds", "Retirement Plans", "Stocks"],
        )
        self.portfolio_id = portfolio["id"]
        now = datetime.utcnow().isoformat()
        with self.main._db_connection() as conn:
            conn.execute(
                """
                INSERT INTO portfolio_category_settings
                (portfolio_id, category, is_investment, updated_at)
                VALUES (?, ?, ?, ?)
                """,
                (self.portfolio_id, "Cash", 0, now),
            )
            conn.execute(
                """
                INSERT INTO santander_category_map
                (portfolio_id, account_key, category, ignore, updated_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (self.portfolio_id, "conta ordenado", "Cash", 0, now),
            )
            conn.execute(
                """
                INSERT INTO bancoinvest_category_map
                (portfolio_id, holder_key, category, updated_at)
                VALUES (?, ?, ?, ?)
                """,
                (self.portfolio_id, "ricardo", "Retirement Plans", now),
            )

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def test_delete_portfolio_removes_data(self) -> None:
        deleted = self.main._delete_portfolio(self.portfolio_id)
        self.assertTrue(deleted)
        with self.main._db_connection() as conn:
            portfolio = conn.execute(
                "SELECT id FROM portfolios WHERE id = ?",
                (self.portfolio_id,),
            ).fetchone()
            self.assertIsNone(portfolio)
            cat_settings = conn.execute(
                "SELECT id FROM portfolio_category_settings WHERE portfolio_id = ?",
                (self.portfolio_id,),
            ).fetchall()
            self.assertEqual(len(cat_settings), 0)
            santander_map = conn.execute(
                "SELECT id FROM santander_category_map WHERE portfolio_id = ?",
                (self.portfolio_id,),
            ).fetchall()
            self.assertEqual(len(santander_map), 0)
            bancoinvest_map = conn.execute(
                "SELECT id FROM bancoinvest_category_map WHERE portfolio_id = ?",
                (self.portfolio_id,),
            ).fetchall()
            self.assertEqual(len(bancoinvest_map), 0)


if __name__ == "__main__":
    unittest.main()
