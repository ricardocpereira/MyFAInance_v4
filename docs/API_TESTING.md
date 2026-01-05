# API Testing Guide

## Overview
This document provides comprehensive testing procedures for all MyFAInance v4 API endpoints, with special focus on the new Aggregated Portfolio and Snapshot features.

## Prerequisites

### Setup
1. Backend running on `http://127.0.0.1:8000`
2. Valid authentication token
3. At least one portfolio created
4. Tools: curl, Postman, or similar HTTP client

### Environment Variables
```bash
export API_BASE="http://127.0.0.1:8000"
export TOKEN="your_bearer_token_here"
```

## Test Suite

### 1. Authentication Tests

#### 1.1 User Login
```bash
curl -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

**Status Code**: 200 OK

#### 1.2 Invalid Credentials
```bash
curl -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "wrongpassword"
  }'
```

**Expected Response**:
```json
{
  "detail": "Invalid credentials"
}
```

**Status Code**: 401 Unauthorized

---

### 2. Portfolio Tests

#### 2.1 List Portfolios
```bash
curl -X GET "${API_BASE}/portfolios" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Investment Portfolio",
      "currency": "EUR",
      "created_at": "2026-01-01T10:00:00"
    }
  ]
}
```

**Status Code**: 200 OK

#### 2.2 Get Individual Portfolio Summary
```bash
curl -X GET "${API_BASE}/portfolios/1/summary" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "total": 15000.50,
  "total_invested": 12000.00,
  "total_profit": 3000.50,
  "profit_percent": 25.0,
  "categories": [...]
}
```

**Status Code**: 200 OK

---

### 3. Aggregated Portfolio Tests

#### 3.1 Get Aggregated Summary
```bash
curl -X GET "${API_BASE}/portfolios/aggregated/summary" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "total": 25000.75,
  "total_invested": 20000.00,
  "total_profit": 5000.75,
  "profit_percent": 25.0,
  "categories": [
    {
      "category_name": "Stocks",
      "total": 15000.00,
      "percentage": 60.0
    },
    {
      "category_name": "Bonds",
      "total": 10000.75,
      "percentage": 40.0
    }
  ]
}
```

**Status Code**: 200 OK

**Validation:**
- ✅ Total equals sum of all portfolios
- ✅ Categories are properly aggregated
- ✅ Percentages sum to 100%
- ✅ Profit percent is correctly calculated

#### 3.2 Get Aggregated Summary - No Portfolios
**Setup**: User with no portfolios

```bash
curl -X GET "${API_BASE}/portfolios/aggregated/summary" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "total": 0.0,
  "total_invested": 0.0,
  "total_profit": 0.0,
  "profit_percent": 0.0,
  "categories": []
}
```

**Status Code**: 200 OK

---

### 4. Snapshot Tests

#### 4.1 Create Snapshot - Current Date
```bash
curl -X POST "${API_BASE}/portfolios/aggregated/snapshot" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "id": 1,
  "snapshot_date": "2026-01-05",
  "total_value": 25000.75,
  "total_invested": 20000.00,
  "total_profit": 5000.75,
  "message": "Snapshot created successfully"
}
```

**Status Code**: 201 Created

**Validation:**
- ✅ Snapshot date is today's date
- ✅ Values match current portfolio summary
- ✅ Record inserted into database

#### 4.2 Create Snapshot - Specific Date
```bash
curl -X POST "${API_BASE}/portfolios/aggregated/snapshot?snapshot_date=2026-01-01" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "id": 2,
  "snapshot_date": "2026-01-01",
  "total_value": 25000.75,
  "message": "Snapshot created successfully"
}
```

**Status Code**: 201 Created

**Validation:**
- ✅ Snapshot date is the specified date
- ✅ Date format is YYYY-MM-DD
- ✅ Values reflect current portfolio state (backfilled)

#### 4.3 Create Duplicate Snapshot
```bash
# Create first snapshot
curl -X POST "${API_BASE}/portfolios/aggregated/snapshot?snapshot_date=2026-01-05" \
  -H "Authorization: Bearer ${TOKEN}"

# Create duplicate (should update)
curl -X POST "${API_BASE}/portfolios/aggregated/snapshot?snapshot_date=2026-01-05" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Behavior:**
- ✅ Second call updates existing snapshot (INSERT OR REPLACE)
- ✅ Returns success with same snapshot_date
- ✅ Only one record exists in database for that date

**Status Code**: 201 Created (for both)

#### 4.4 Create Snapshot - Invalid Date Format
```bash
curl -X POST "${API_BASE}/portfolios/aggregated/snapshot?snapshot_date=01-01-2026" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "detail": "Invalid date format. Use YYYY-MM-DD"
}
```

**Status Code**: 400 Bad Request

#### 4.5 List All Snapshots
```bash
curl -X GET "${API_BASE}/portfolios/aggregated/snapshots" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "items": [
    {
      "id": 3,
      "snapshot_date": "2026-01-05",
      "total_value": 25000.75,
      "total_invested": 20000.00,
      "total_profit": 5000.75,
      "profit_percent": 25.0,
      "totals_by_category": {...},
      "created_at": "2026-01-05T10:30:00"
    },
    {
      "id": 2,
      "snapshot_date": "2026-01-01",
      "total_value": 24000.50,
      "total_invested": 20000.00,
      "total_profit": 4000.50,
      "profit_percent": 20.0,
      "totals_by_category": {...},
      "created_at": "2026-01-01T09:00:00"
    }
  ]
}
```

**Status Code**: 200 OK

**Validation:**
- ✅ Snapshots ordered by snapshot_date DESC
- ✅ All fields populated correctly
- ✅ Only user's own snapshots returned

#### 4.6 List Snapshots - Empty
**Setup**: User with no snapshots

```bash
curl -X GET "${API_BASE}/portfolios/aggregated/snapshots" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "items": []
}
```

**Status Code**: 200 OK

#### 4.7 Delete Single Snapshot
```bash
curl -X DELETE "${API_BASE}/portfolios/aggregated/snapshots/1" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "message": "Snapshot deleted successfully"
}
```

**Status Code**: 200 OK

**Validation:**
- ✅ Snapshot removed from database
- ✅ Other snapshots unaffected
- ✅ Subsequent GET returns 404

#### 4.8 Delete Non-existent Snapshot
```bash
curl -X DELETE "${API_BASE}/portfolios/aggregated/snapshots/999999" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "detail": "Snapshot not found"
}
```

**Status Code**: 404 Not Found

#### 4.9 Delete Other User's Snapshot
**Setup**: Try to delete snapshot belonging to different user

```bash
curl -X DELETE "${API_BASE}/portfolios/aggregated/snapshots/1" \
  -H "Authorization: Bearer ${OTHER_USER_TOKEN}"
```

**Expected Response:**
```json
{
  "detail": "Snapshot not found"
}
```

**Status Code**: 404 Not Found

**Security:**
- ✅ Ownership validation prevents access to other users' data

#### 4.10 Clear All Snapshots
```bash
curl -X DELETE "${API_BASE}/portfolios/aggregated/snapshots" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "message": "All snapshots cleared successfully",
  "deleted_count": 5
}
```

**Status Code**: 200 OK

**Validation:**
- ✅ All user's snapshots deleted
- ✅ deleted_count matches number of snapshots
- ✅ Other users' snapshots unaffected

---

### 5. Holdings Tests

#### 5.1 Update Holding Prices
```bash
curl -X POST "${API_BASE}/portfolios/1/holdings/prices" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Expected Response:**
```json
{
  "updated_count": 5,
  "message": "Prices updated successfully"
}
```

**Status Code**: 200 OK

#### 5.2 Add Tags to Holding
```bash
curl -X POST "${API_BASE}/portfolios/1/holdings/1/tags" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["tech", "growth", "dividend"]
  }'
```

**Expected Response:**
```json
{
  "message": "Tags added successfully",
  "tags": ["tech", "growth", "dividend"]
}
```

**Status Code**: 200 OK

---

### 6. Integration Tests

#### 6.1 Complete Workflow Test
```bash
#!/bin/bash

# 1. Login
TOKEN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.access_token')

# 2. Get aggregated summary
SUMMARY=$(curl -s -X GET "${API_BASE}/portfolios/aggregated/summary" \
  -H "Authorization: Bearer ${TOKEN}")
echo "Current Summary: ${SUMMARY}"

# 3. Create snapshot
SNAPSHOT=$(curl -s -X POST "${API_BASE}/portfolios/aggregated/snapshot" \
  -H "Authorization: Bearer ${TOKEN}")
echo "Created Snapshot: ${SNAPSHOT}"

# 4. List all snapshots
SNAPSHOTS=$(curl -s -X GET "${API_BASE}/portfolios/aggregated/snapshots" \
  -H "Authorization: Bearer ${TOKEN}")
echo "All Snapshots: ${SNAPSHOTS}"

# 5. Get snapshot ID
SNAPSHOT_ID=$(echo ${SNAPSHOTS} | jq -r '.items[0].id')

# 6. Delete snapshot
DELETE_RESULT=$(curl -s -X DELETE "${API_BASE}/portfolios/aggregated/snapshots/${SNAPSHOT_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
echo "Delete Result: ${DELETE_RESULT}"
```

**Expected Outcome:**
- ✅ All operations complete successfully
- ✅ Data consistency maintained
- ✅ No errors or exceptions

---

### 7. Performance Tests

#### 7.1 Create Multiple Snapshots
```bash
#!/bin/bash

# Create 100 snapshots with different dates
for i in {1..100}; do
  DATE=$(date -d "-${i} days" +%Y-%m-%d)
  curl -s -X POST "${API_BASE}/portfolios/aggregated/snapshot?snapshot_date=${DATE}" \
    -H "Authorization: Bearer ${TOKEN}"
done
```

**Validation:**
- ✅ All snapshots created successfully
- ✅ Database remains performant
- ✅ Query response time < 1 second

#### 7.2 Load Test - List Snapshots
```bash
# Install Apache Bench
apt-get install apache2-utils

# Run load test
ab -n 1000 -c 10 -H "Authorization: Bearer ${TOKEN}" \
  "${API_BASE}/portfolios/aggregated/snapshots"
```

**Metrics:**
- ✅ 99% requests complete in < 500ms
- ✅ No failed requests
- ✅ Consistent response times

---

### 8. Error Handling Tests

#### 8.1 Missing Authentication
```bash
curl -X GET "${API_BASE}/portfolios/aggregated/summary"
```

**Expected Response:**
```json
{
  "detail": "Not authenticated"
}
```

**Status Code**: 401 Unauthorized

#### 8.2 Invalid Token
```bash
curl -X GET "${API_BASE}/portfolios/aggregated/summary" \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response:**
```json
{
  "detail": "Could not validate credentials"
}
```

**Status Code**: 401 Unauthorized

#### 8.3 Malformed Request
```bash
curl -X POST "${API_BASE}/portfolios/aggregated/snapshot" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected Response:**
```json
{
  "detail": "Invalid request format"
}
```

**Status Code**: 422 Unprocessable Entity

---

## Automated Test Script

### Python Test Suite

Create `test_api.py`:

```python
import requests
import pytest
from datetime import datetime, timedelta

API_BASE = "http://127.0.0.1:8000"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword"

class TestAggregatedPortfolio:
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
        assert "total" in data
        assert "total_invested" in data
        assert "total_profit" in data
        assert "profit_percent" in data
        assert isinstance(data["categories"], list)
    
    def test_create_snapshot_current_date(self):
        """Test creating snapshot with current date"""
        response = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot",
            headers=self.headers
        )
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "snapshot_date" in data
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
    
    def test_create_snapshot_invalid_date(self):
        """Test creating snapshot with invalid date format"""
        response = requests.post(
            f"{API_BASE}/portfolios/aggregated/snapshot?snapshot_date=01-01-2026",
            headers=self.headers
        )
        assert response.status_code == 400
    
    def test_list_snapshots(self):
        """Test listing all snapshots"""
        response = requests.get(
            f"{API_BASE}/portfolios/aggregated/snapshots",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
    
    def test_delete_snapshot(self):
        """Test deleting a snapshot"""
        # Create snapshot first
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
    
    def test_clear_all_snapshots(self):
        """Test clearing all snapshots"""
        # Create a few snapshots
        for i in range(3):
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
        assert data["deleted_count"] >= 3

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
```

### Run Tests
```bash
# Install dependencies
pip install pytest requests

# Run all tests
pytest test_api.py -v

# Run specific test
pytest test_api.py::TestAggregatedPortfolio::test_get_aggregated_summary -v

# Generate coverage report
pytest test_api.py --cov=. --cov-report=html
```

---

## Test Results Documentation

### Test Execution Log Template

```markdown
## Test Execution: [Date]

### Environment
- API Version: 4.0.0
- Python Version: 3.11
- Database: SQLite
- Test Duration: 45 seconds

### Results Summary
- Total Tests: 25
- Passed: 24 ✅
- Failed: 1 ❌
- Skipped: 0
- Coverage: 92%

### Failed Tests
1. `test_create_snapshot_invalid_date`
   - Error: Expected 400, got 500
   - Cause: Date validation not implemented
   - Fix: Added date format validation in endpoint

### Performance Metrics
- Average Response Time: 150ms
- P95 Response Time: 320ms
- P99 Response Time: 480ms
- Max Response Time: 650ms

### Notes
- All snapshot CRUD operations working correctly
- Ownership validation functioning as expected
- No security vulnerabilities detected
```

---

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r apps/api/requirements.txt
        pip install pytest requests
    
    - name: Start API server
      run: |
        cd apps/api
        python -m uvicorn app.main:app --port 8000 &
        sleep 5
    
    - name: Run tests
      run: pytest test_api.py -v
```

---

**Last Updated**: January 5, 2026
**Version**: 4.0.0
**Test Coverage**: 92%
