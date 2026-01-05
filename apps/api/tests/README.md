# Testing Quick Start

## Prerequisites

```bash
# Install Python dependencies
cd apps/api
pip install -r requirements.txt
pip install pytest requests

# Ensure API is running
python -m uvicorn app.main:app --reload --port 8000
```

## Run Tests

### All Tests
```bash
cd apps/api
pytest tests/test_aggregated_portfolio.py -v
```

### Specific Test Class
```bash
# Authentication tests only
pytest tests/test_aggregated_portfolio.py::TestAuthentication -v

# Aggregated portfolio tests only
pytest tests/test_aggregated_portfolio.py::TestAggregatedPortfolio -v

# Snapshot tests only
pytest tests/test_aggregated_portfolio.py::TestSnapshots -v

# Integration tests only
pytest tests/test_aggregated_portfolio.py::TestIntegration -v
```

### Specific Test
```bash
pytest tests/test_aggregated_portfolio.py::TestSnapshots::test_create_snapshot_current_date -v
```

### With Coverage Report
```bash
pytest tests/test_aggregated_portfolio.py --cov=app --cov-report=html -v
```

## Test Configuration

Edit test file to change configuration:

```python
# apps/api/tests/test_aggregated_portfolio.py
API_BASE = "http://127.0.0.1:8000"  # Change if API runs on different port
TEST_EMAIL = "test@example.com"     # Your test user email
TEST_PASSWORD = "testpassword"      # Your test user password
```

## Expected Results

All tests should pass:
```
======================== test session starts =========================
collected 25 items

tests/test_aggregated_portfolio.py::TestAuthentication::test_login_success PASSED           [  4%]
tests/test_aggregated_portfolio.py::TestAuthentication::test_login_invalid_credentials PASSED [ 8%]
tests/test_aggregated_portfolio.py::TestAggregatedPortfolio::test_get_aggregated_summary PASSED [ 12%]
...
======================== 25 passed in 5.32s ==========================
```

## Troubleshooting

### API Not Running
```
Error: requests.exceptions.ConnectionError
Solution: Start the API server first
```

### Authentication Failure
```
Error: 401 Unauthorized
Solution: Verify TEST_EMAIL and TEST_PASSWORD are correct
```

### Database Errors
```
Error: sqlite3.OperationalError
Solution: Check database file permissions and schema is up to date
```

## Manual API Testing

Use curl or Postman:

```bash
# Get token
TOKEN=$(curl -s -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}' \
  | jq -r '.access_token')

# Get aggregated summary
curl -X GET "http://127.0.0.1:8000/portfolios/aggregated/summary" \
  -H "Authorization: Bearer ${TOKEN}"

# Create snapshot
curl -X POST "http://127.0.0.1:8000/portfolios/aggregated/snapshot" \
  -H "Authorization: Bearer ${TOKEN}"

# List snapshots
curl -X GET "http://127.0.0.1:8000/portfolios/aggregated/snapshots" \
  -H "Authorization: Bearer ${TOKEN}"
```

## More Information

See full testing documentation: [docs/API_TESTING.md](../docs/API_TESTING.md)
