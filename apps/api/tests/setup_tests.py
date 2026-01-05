"""
Setup script for MyFAInance v4 testing environment
Prepares database and creates test user if needed
"""

import sqlite3
import hashlib
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "portfolio_tracker.db"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword"


def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def setup_test_user():
    """Create or verify test user exists"""
    print("Setting up test user...")
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute(
        "SELECT email FROM users WHERE email = ?",
        (TEST_EMAIL,)
    )
    
    if cursor.fetchone():
        print(f"✅ Test user already exists: {TEST_EMAIL}")
    else:
        # Create test user
        password_hash = hash_password(TEST_PASSWORD)
        cursor.execute(
            """
            INSERT INTO users (email, password_hash, created_at)
            VALUES (?, ?, datetime('now'))
            """,
            (TEST_EMAIL, password_hash)
        )
        conn.commit()
        print(f"✅ Test user created: {TEST_EMAIL}")
    
    conn.close()


def verify_database_schema():
    """Verify all required tables exist"""
    print("\nVerifying database schema...")
    
    required_tables = [
        "users",
        "portfolios",
        "holdings",
        "aggregated_snapshots"
    ]
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    )
    existing_tables = [row[0] for row in cursor.fetchall()]
    
    for table in required_tables:
        if table in existing_tables:
            print(f"✅ Table '{table}' exists")
        else:
            print(f"❌ Table '{table}' missing!")
    
    conn.close()


def create_test_portfolio():
    """Create a test portfolio if user doesn't have one"""
    print("\nSetting up test portfolio...")
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Check if user has portfolios
    cursor.execute(
        "SELECT id, name FROM portfolios WHERE owner_email = ?",
        (TEST_EMAIL,)
    )
    
    portfolios = cursor.fetchall()
    
    if portfolios:
        print(f"✅ User has {len(portfolios)} portfolio(s):")
        for pid, name in portfolios:
            print(f"   - ID {pid}: {name}")
    else:
        # Create test portfolio
        cursor.execute(
            """
            INSERT INTO portfolios (owner_email, name, currency, created_at)
            VALUES (?, ?, ?, datetime('now'))
            """,
            (TEST_EMAIL, "Test Portfolio", "EUR")
        )
        conn.commit()
        portfolio_id = cursor.lastrowid
        print(f"✅ Test portfolio created: ID {portfolio_id}")
    
    conn.close()


def clear_test_data():
    """Clear any existing test snapshots"""
    print("\nCleaning up old test data...")
    
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Clear aggregated snapshots for test user
    cursor.execute(
        "DELETE FROM aggregated_snapshots WHERE owner_email = ?",
        (TEST_EMAIL,)
    )
    deleted_count = cursor.rowcount
    conn.commit()
    
    print(f"✅ Cleared {deleted_count} old snapshot(s)")
    
    conn.close()


def main():
    """Run all setup steps"""
    print("="*60)
    print("MyFAInance v4 - Test Environment Setup")
    print("="*60 + "\n")
    
    if not DB_PATH.exists():
        print(f"❌ Database not found at: {DB_PATH}")
        print("Please run the API server first to create the database.")
        return 1
    
    try:
        verify_database_schema()
        setup_test_user()
        create_test_portfolio()
        clear_test_data()
        
        print("\n" + "="*60)
        print("✅ Setup complete! Ready to run tests.")
        print("="*60 + "\n")
        print("Run tests with: pytest tests/test_aggregated_portfolio.py -v")
        print(f"\nTest credentials:")
        print(f"  Email: {TEST_EMAIL}")
        print(f"  Password: {TEST_PASSWORD}")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        return 1


if __name__ == "__main__":
    exit(main())
