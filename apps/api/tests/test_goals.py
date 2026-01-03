import os
import sys
import tempfile
import importlib
import unittest
from datetime import date, timedelta


class GoalsSummaryTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        os.environ["DB_PATH"] = os.path.join(self.tempdir.name, "test.db")
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
        import app.main as main

        self.main = importlib.reload(main)
        self.main._init_db()
        self.email = "user@example.com"
        goal = self.main._create_goal(self.email, "Test Goal")
        self.goal_id = goal["id"]

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def test_goal_summary_with_contributions(self) -> None:
        start_date = (date.today() - timedelta(days=365)).isoformat()
        self.main._update_goal_inputs(
            self.goal_id,
            self.main.GoalInputRequest(
                start_date=start_date,
                duration_years=30,
                sp500_return=10.0,
                desired_monthly=1000.0,
                planned_monthly=250.0,
                withdrawal_rate=4.0,
                initial_investment=1000.0,
                inflation_rate=3.0,
                return_method="cagr",
            ),
        )
        for month in range(12):
            contrib_date = (date.today() - timedelta(days=30 * (11 - month))).isoformat()
            self.main._add_goal_contribution(
                self.goal_id,
                self.main.GoalContributionRequest(
                    contribution_date=contrib_date,
                    amount=100.0,
                ),
            )
        summary = self.main._goal_summary(self.email, self.goal_id, None)
        portfolio = summary["portfolio_fire"]["metrics"]
        simulation = summary["simulation_fire"]["metrics"]
        self.assertGreater(portfolio["invested_total"], 0)
        self.assertGreater(simulation["invested_total"], 0)
        self.assertEqual(len(summary["contributions"]), 12)
        self.assertEqual(portfolio["avg_monthly"], 100.0)
        self.assertEqual(simulation["avg_monthly"], 250.0)
        self.assertGreater(portfolio["future_value_1000"], 0)
        self.assertIsNotNone(simulation["fire_target"])
        self.assertEqual(
            len(summary["portfolio_fire"]["projection"]),
            int(summary["inputs"]["duration_years"]) + 1,
        )


if __name__ == "__main__":
    unittest.main()
