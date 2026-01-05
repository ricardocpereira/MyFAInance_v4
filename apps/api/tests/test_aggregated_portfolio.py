"""
MyFAInance v4 - API Test Suite
Tests for Aggregated Portfolio and Snapshot features
"""

import requests
import pytest
from datetime import datetime, timedelta
import json

# Configuration
API_BASE = "http://127.0.0.1:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword"


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """Test successful login"""
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": TEST_EMAIL, "password": "wrongpassword"}
        )
        assert response.status_code == 401


class TestAggregatedPortfolio:
    """Test aggregated portfolio endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token before each test"""
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_aggregated_summary(self):
        """Test getting aggregated portfolio summary"""
        response = requests.get(
            f"{API_BASE}/portfolios/aggregated/summary",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "total" in data
        assert "total_invested" in data
        assert "total_profit" in data
        assert "profit_percent" in data
        assert "categories" in data
        
        # Validate data types
        assert isinstance(data["total"], (int, float))
        assert isinstance(data["total_invested"], (int, float))
        assert isinstance(data["total_profit"], (int, float))
        assert isinstance(data["profit_percent"], (int, float))
        assert isinstance(data["categories"], list)
        
        # Validate calculations
        if data["total_invested"] > 0:
            expected_profit_percent = (data["total_profit"] / data["total_invested"]) * 100
            assert abs(data["profit_percent"] - expected_profit_percent) < 0.01
    
    def test_get_aggregated_summary_unauthorized(self):
        """Test getting summary without authentication"""
        response = requests.get(
            f"{API_BASE}/portfolios/aggregated/summary"
        )
        assert response.status_code == 401


class TestSnapshots:
    """Test snapshot CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        # Login
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Clear all snapshots before test
        requests.delete(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
    
    def test_create_snapshot_current_date(self):
        """Test creating snapshot with current date"""
        response = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot",
            headers=self.headers
        )
        assert response.status_code == 201
        data = response.json()
        
        # Check response fields
        assert "id" in data
        assert "snapshot_date" in data
        assert "total_value" in data
        assert "message" in data
        
        # Verify date is today
        assert data["snapshot_date"] == datetime.now().strftime("%Y-%m-%d")
    
    def test_create_snapshot_specific_date(self):
        """Test creating snapshot with specific date"""
        date = "2026-01-01"
        response = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
            headers=self.headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["snapshot_date"] == date
    
    def test_create_snapshot_past_date(self):
        """Test creating snapshot with past date"""
        date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        response = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
            headers=self.headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["snapshot_date"] == date
    
    def test_create_snapshot_future_date(self):
        """Test creating snapshot with future date"""
        date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        response = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
            headers=self.headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["snapshot_date"] == date
    
    def test_create_duplicate_snapshot(self):
        """Test creating duplicate snapshot (should update)"""
        date = "2026-01-05"
        
        # Create first snapshot
        response1 = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
            headers=self.headers
        )
        assert response1.status_code == 201
        
        # Create duplicate (should update, not error)
        response2 = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
            headers=self.headers
        )
        assert response2.status_code == 201
        
        # Verify only one snapshot exists for that date
        list_response = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        snapshots = list_response.json()["items"]
        date_snapshots = [s for s in snapshots if s["snapshot_date"] == date]
        assert len(date_snapshots) == 1
    
    def test_create_snapshot_invalid_date_format(self):
        """Test creating snapshot with invalid date format"""
        invalid_dates = [
            "01-01-2026",  # Wrong format
            "2026/01/01",  # Wrong separator
            "20260101",    # No separator
            "invalid",     # Not a date
        ]
        
        for date in invalid_dates:
            response = requests.post(
                f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
                headers=self.headers
            )
            # Should return error (400 or 422)
            assert response.status_code in [400, 422]
    
    def test_list_snapshots(self):
        """Test listing all snapshots"""
        # Create multiple snapshots
        dates = ["2026-01-01", "2026-01-02", "2026-01-03"]
        for date in dates:
            requests.post(
                f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
                headers=self.headers
            )
        
        # List snapshots
        response = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) >= 3
        
        # Verify each snapshot has required fields
        for snapshot in data["items"]:
            assert "id" in snapshot
            assert "snapshot_date" in snapshot
            assert "total_value" in snapshot
            assert "total_invested" in snapshot
            assert "total_profit" in snapshot
            assert "profit_percent" in snapshot
            assert "created_at" in snapshot
        
        # Verify snapshots are ordered by date DESC
        snapshot_dates = [s["snapshot_date"] for s in data["items"]]
        assert snapshot_dates == sorted(snapshot_dates, reverse=True)
    
    def test_list_snapshots_empty(self):
        """Test listing snapshots when none exist"""
        response = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["items"] == []
    
    def test_delete_snapshot(self):
        """Test deleting a single snapshot"""
        # Create snapshot
        create_response = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot",
            headers=self.headers
        )
        snapshot_id = create_response.json()["id"]
        
        # Delete it
        delete_response = requests.delete(
            f"{API_BASE}/portfolios/aggregated/snapshots/{snapshot_id}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert "message" in data
        
        # Verify it's deleted
        list_response = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        snapshots = list_response.json()["items"]
        snapshot_ids = [s["id"] for s in snapshots]
        assert snapshot_id not in snapshot_ids
    
    def test_delete_nonexistent_snapshot(self):
        """Test deleting a snapshot that doesn't exist"""
        response = requests.delete(
            f"{API_BASE}/portfolios/aggregated/snapshots/999999",
            headers=self.headers
        )
        assert response.status_code == 404
    
    def test_clear_all_snapshots(self):
        """Test clearing all snapshots"""
        # Create multiple snapshots
        snapshot_count = 5
        for i in range(snapshot_count):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            requests.post(
                f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
                headers=self.headers
            )
        
        # Clear all
        response = requests.delete(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response
        assert "message" in data
        assert "deleted_count" in data
        assert data["deleted_count"] == snapshot_count
        
        # Verify all deleted
        list_response = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        assert list_response.json()["items"] == []


class TestIntegration:
    """Integration tests for complete workflows"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for integration tests"""
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Clear snapshots
        requests.delete(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
    
    def test_complete_snapshot_workflow(self):
        """Test complete workflow: create, list, delete"""
        # Step 1: Get current summary
        summary_response = requests.get(
            f"{API_BASE}/portfolios/aggregated/summary",
            headers=self.headers
        )
        assert summary_response.status_code == 200
        summary = summary_response.json()
        
        # Step 2: Create snapshot
        create_response = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot",
            headers=self.headers
        )
        assert create_response.status_code == 201
        snapshot = create_response.json()
        
        # Verify snapshot matches summary
        assert snapshot["total_value"] == summary["total"]
        
        # Step 3: List snapshots
        list_response = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        assert list_response.status_code == 200
        snapshots = list_response.json()["items"]
        assert len(snapshots) == 1
        assert snapshots[0]["id"] == snapshot["id"]
        
        # Step 4: Delete snapshot
        delete_response = requests.delete(
            f"{API_BASE}/portfolios/aggregated/snapshots/{snapshot['id']}",
            headers=self.headers
        )
        assert delete_response.status_code == 200
        
        # Step 5: Verify deletion
        final_list = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        assert final_list.json()["items"] == []
    
    def test_historical_snapshot_series(self):
        """Test creating a series of historical snapshots"""
        # Create 30 days of snapshots
        dates = []
        for i in range(30):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            dates.append(date)
            response = requests.post(
                f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date={date}",
                headers=self.headers
            )
            assert response.status_code == 201
        
        # List and verify
        list_response = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        snapshots = list_response.json()["items"]
        assert len(snapshots) == 30
        
        # Verify chronological order (DESC)
        snapshot_dates = [s["snapshot_date"] for s in snapshots]
        assert snapshot_dates == sorted(dates, reverse=True)


def run_tests():
    """Run all tests and generate report"""
    print("\n" + "="*60)
    print("MyFAInance v4 - API Test Suite")
    print("="*60 + "\n")
    
    # Run pytest with verbose output
    exit_code = pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--color=yes"
    ])
    
    return exit_code


if __name__ == "__main__":
    exit(run_tests())
