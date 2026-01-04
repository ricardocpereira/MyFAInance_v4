-- MyFAInance PostgreSQL Schema Migration
-- From SQLite to PostgreSQL

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) PRIMARY KEY,
    salt VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_codes (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS reset_codes (
    email VARCHAR(255) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

-- Portfolios
CREATE TABLE IF NOT EXISTS portfolios (
    id SERIAL PRIMARY KEY,
    owner_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    categories_json TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(owner_email, name)
);

CREATE TABLE IF NOT EXISTS user_profiles (
    email VARCHAR(255) PRIMARY KEY,
    age INTEGER,
    updated_at TIMESTAMP NOT NULL
);

-- Debts
CREATE TABLE IF NOT EXISTS debts (
    id SERIAL PRIMARY KEY,
    owner_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    original_amount NUMERIC(15,2) NOT NULL,
    current_balance NUMERIC(15,2) NOT NULL,
    monthly_payment NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    owner_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(owner_email, name)
);

CREATE TABLE IF NOT EXISTS goal_inputs (
    goal_id INTEGER PRIMARY KEY REFERENCES goals(id) ON DELETE CASCADE,
    start_date VARCHAR(50) NOT NULL,
    duration_years NUMERIC(10,2) NOT NULL,
    sp500_return NUMERIC(10,4) NOT NULL,
    desired_monthly NUMERIC(15,2) NOT NULL,
    planned_monthly NUMERIC(15,2) NOT NULL,
    withdrawal_rate NUMERIC(10,4) NOT NULL,
    initial_investment NUMERIC(15,2) NOT NULL,
    inflation_rate NUMERIC(10,4) NOT NULL,
    portfolio_inflation_rate NUMERIC(10,4),
    simulation_current_age NUMERIC(10,2),
    simulation_retirement_age NUMERIC(10,2),
    simulation_annual_spending NUMERIC(15,2),
    simulation_current_assets NUMERIC(15,2),
    simulation_monthly_contribution NUMERIC(15,2),
    simulation_return_rate NUMERIC(10,4),
    simulation_inflation_rate NUMERIC(10,4),
    simulation_swr NUMERIC(10,4),
    return_method VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS goal_contributions (
    id SERIAL PRIMARY KEY,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    contribution_date VARCHAR(50) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

-- Santander Imports
CREATE TABLE IF NOT EXISTS santander_imports (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    imported_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS santander_items (
    id SERIAL PRIMARY KEY,
    import_id INTEGER NOT NULL REFERENCES santander_imports(id) ON DELETE CASCADE,
    section VARCHAR(255) NOT NULL,
    account VARCHAR(255) NOT NULL,
    description TEXT,
    balance NUMERIC(15,2) NOT NULL,
    category VARCHAR(255) NOT NULL,
    invested NUMERIC(15,2),
    gains NUMERIC(15,2)
);

CREATE TABLE IF NOT EXISTS santander_category_map (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    account_key VARCHAR(500) NOT NULL,
    category VARCHAR(255) NOT NULL,
    ignore BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, account_key)
);

-- Trade Republic
CREATE TABLE IF NOT EXISTS trade_republic_entries (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    available_cash NUMERIC(15,2) NOT NULL,
    interests_received NUMERIC(15,2) NOT NULL,
    invested NUMERIC(15,2) NOT NULL,
    value NUMERIC(15,2) NOT NULL,
    gains NUMERIC(15,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    category VARCHAR(255),
    source VARCHAR(255) NOT NULL,
    source_file VARCHAR(500),
    file_hash VARCHAR(64),
    snapshot_date VARCHAR(50),
    created_at TIMESTAMP NOT NULL
);

-- Save N Grow
CREATE TABLE IF NOT EXISTS save_ngrow_entries (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    invested NUMERIC(15,2) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL,
    profit_value NUMERIC(15,2),
    profit_percent NUMERIC(10,4),
    currency VARCHAR(10) NOT NULL,
    source_file VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    snapshot_date VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, file_hash)
);

CREATE TABLE IF NOT EXISTS save_ngrow_imports (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    invested_total NUMERIC(15,2) NOT NULL,
    current_value_total NUMERIC(15,2) NOT NULL,
    profit_value_total NUMERIC(15,2),
    profit_percent_total NUMERIC(10,4),
    currency VARCHAR(10) NOT NULL,
    source_file VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    snapshot_date VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, file_hash)
);

CREATE TABLE IF NOT EXISTS save_ngrow_items (
    id SERIAL PRIMARY KEY,
    import_id INTEGER NOT NULL REFERENCES save_ngrow_imports(id) ON DELETE CASCADE,
    item_name VARCHAR(500) NOT NULL,
    invested NUMERIC(15,2),
    current_value NUMERIC(15,2) NOT NULL,
    profit_value NUMERIC(15,2),
    profit_percent NUMERIC(10,4),
    category VARCHAR(255) NOT NULL
);

-- Aforronet
CREATE TABLE IF NOT EXISTS aforronet_imports (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    invested_total NUMERIC(15,2) NOT NULL,
    current_value_total NUMERIC(15,2) NOT NULL,
    category VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    source_file VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    snapshot_date VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, file_hash)
);

CREATE TABLE IF NOT EXISTS aforronet_items (
    id SERIAL PRIMARY KEY,
    import_id INTEGER NOT NULL REFERENCES aforronet_imports(id) ON DELETE CASCADE,
    item_name VARCHAR(500) NOT NULL,
    invested NUMERIC(15,2) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL,
    category VARCHAR(255) NOT NULL
);

-- BancoInvest
CREATE TABLE IF NOT EXISTS bancoinvest_imports (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    source_file VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    snapshot_date VARCHAR(50),
    imported_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, file_hash)
);

CREATE TABLE IF NOT EXISTS bancoinvest_items (
    id SERIAL PRIMARY KEY,
    import_id INTEGER NOT NULL REFERENCES bancoinvest_imports(id) ON DELETE CASCADE,
    holder VARCHAR(255) NOT NULL,
    invested NUMERIC(15,2),
    current_value NUMERIC(15,2) NOT NULL,
    gains NUMERIC(15,2),
    category VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS bancoinvest_category_map (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    holder_key VARCHAR(500) NOT NULL,
    category VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, holder_key)
);

-- XTB
CREATE TABLE IF NOT EXISTS xtb_imports (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    account_type VARCHAR(100) NOT NULL,
    category VARCHAR(255) NOT NULL,
    current_value NUMERIC(15,2) NOT NULL,
    cash_value NUMERIC(15,2) NOT NULL,
    invested NUMERIC(15,2) NOT NULL,
    profit_value NUMERIC(15,2),
    profit_percent NUMERIC(10,4),
    source_file VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    imported_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, file_hash)
);

-- Holdings
CREATE TABLE IF NOT EXISTS holdings_prices (
    ticker VARCHAR(50) PRIMARY KEY,
    price NUMERIC(15,4) NOT NULL,
    currency VARCHAR(10),
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS holdings_imports (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    source_file VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    snapshot_date VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, file_hash)
);

CREATE TABLE IF NOT EXISTS holdings_items (
    id SERIAL PRIMARY KEY,
    import_id INTEGER NOT NULL REFERENCES holdings_imports(id) ON DELETE CASCADE,
    ticker VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    shares NUMERIC(15,4) NOT NULL,
    avg_price NUMERIC(15,4) NOT NULL,
    cost_basis NUMERIC(15,2) NOT NULL,
    current_price NUMERIC(15,4),
    current_value NUMERIC(15,2),
    profit_value NUMERIC(15,2),
    profit_percent NUMERIC(10,4),
    category VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS holdings_metadata (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    ticker VARCHAR(50) NOT NULL,
    sector VARCHAR(255),
    industry VARCHAR(255),
    country VARCHAR(255),
    asset_type VARCHAR(255),
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, ticker)
);

-- Tags
CREATE TABLE IF NOT EXISTS investment_tags (
    id SERIAL PRIMARY KEY,
    owner_email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    name_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(owner_email, name_key)
);

CREATE TABLE IF NOT EXISTS holding_tags (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    ticker VARCHAR(50) NOT NULL,
    tag_name VARCHAR(255) NOT NULL,
    tag_key VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, ticker, tag_key)
);

CREATE TABLE IF NOT EXISTS holding_tag_suppressed (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    ticker VARCHAR(50) NOT NULL,
    tag_key VARCHAR(255) NOT NULL,
    removed_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, ticker, tag_key)
);

-- Transactions
CREATE TABLE IF NOT EXISTS holding_transactions (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    institution VARCHAR(255),
    ticker VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    operation VARCHAR(50) NOT NULL,
    trade_date VARCHAR(50) NOT NULL,
    shares NUMERIC(15,4) NOT NULL,
    price NUMERIC(15,4) NOT NULL,
    fee NUMERIC(15,2),
    note TEXT,
    category VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS holdings_operations (
    id SERIAL PRIMARY KEY,
    import_id INTEGER,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    source_file VARCHAR(500),
    operation_type VARCHAR(100) NOT NULL,
    operation_kind VARCHAR(100),
    ticker VARCHAR(50),
    description TEXT,
    amount NUMERIC(15,2),
    currency VARCHAR(10),
    trade_date VARCHAR(50),
    created_at TIMESTAMP NOT NULL
);

-- Category Settings
CREATE TABLE IF NOT EXISTS portfolio_category_settings (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    is_investment BOOLEAN NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, category)
);

-- Banking
CREATE TABLE IF NOT EXISTS banking_institutions (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, name)
);

CREATE TABLE IF NOT EXISTS banking_categories (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    parent_id INTEGER,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, parent_id, name)
);

CREATE TABLE IF NOT EXISTS banking_imports (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    source_file VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    imported_at TIMESTAMP NOT NULL,
    row_count INTEGER NOT NULL,
    UNIQUE(portfolio_id, file_hash)
);

CREATE TABLE IF NOT EXISTS banking_transactions (
    id SERIAL PRIMARY KEY,
    import_id INTEGER NOT NULL REFERENCES banking_imports(id) ON DELETE CASCADE,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    tx_date VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    balance NUMERIC(15,2),
    currency VARCHAR(10) NOT NULL,
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255) NOT NULL,
    raw_json TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS banking_category_rules (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    match_type VARCHAR(50) NOT NULL,
    match_value VARCHAR(500) NOT NULL,
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255),
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, institution, match_type, match_value)
);

CREATE TABLE IF NOT EXISTS banking_budgets (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    category VARCHAR(255) NOT NULL,
    month VARCHAR(20) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(portfolio_id, category, month)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_portfolios_owner ON portfolios(owner_email);
CREATE INDEX IF NOT EXISTS idx_goals_owner ON goals(owner_email);
CREATE INDEX IF NOT EXISTS idx_debts_owner ON debts(owner_email);
CREATE INDEX IF NOT EXISTS idx_santander_imports_portfolio ON santander_imports(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_imports_portfolio ON holdings_imports(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_holdings_items_ticker ON holdings_items(ticker);
CREATE INDEX IF NOT EXISTS idx_holdings_metadata_portfolio_ticker ON holdings_metadata(portfolio_id, ticker);
CREATE INDEX IF NOT EXISTS idx_holding_tags_portfolio_ticker ON holding_tags(portfolio_id, ticker);
CREATE INDEX IF NOT EXISTS idx_banking_transactions_portfolio ON banking_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_banking_transactions_date ON banking_transactions(tx_date);
