# MyFAInance v2 - User Stories

Source: Prompt v2.docx. Images referenced under `docs/images/v2/`.

## Image references
- Image 1: Landing + login card + hero layout.
- Image 2: Top navigation + portfolio selector bar.
- Image 3: Currency selector list.
- Image 4: Santander Excel source layout.
- Image 5: Santander asset mapping example.
- Image 6: BancoInvest layout (Plano Poupanca Reforma - Posicao Actual).
- Image 7: Save N Grow layout (Reavaliacao).
- Image 8: KPI cards (value, profit, IRR, passive income).
- Image 9: Portfolio evolution + asset allocation chart.
- Image 10: Asset category cards + institutions breakdown table.
- Image 11: Past days breakdown table.
- Image 12: Full dashboard composition.

Updated: 2025-12-29

## Epic 1 - Authentication and Internationalization

### US-1.1 Email + password login with verification
As a user, I want to log in using email and password with email verification, so my account is protected.
Acceptance criteria:
- Email and password are required.
- Email format validation.
- A verification code is sent to the user email.
- Access is granted only after code verification.
- Redirect to the landing page after successful authentication.
Status: Implemented.
Implementation notes:
- Email/password registration + verification code email (mobile scaffold included; Expo + Metro configured for Android testing; request timeout + API base hint; async SMTP sending).
- Session token with expiry; logout invalidates token.
- Password reset via email code.


### US-1.2 Google OAuth login
As a user, I want to log in with Google so I do not need to create new credentials.
Acceptance criteria:
- Google login button is visible on the login screen (Image 1).
- OAuth 2.0 flow is secure.
- First login creates the user profile automatically.
- User data is stored after login.
Status: Not implemented.
Implementation notes:
- Endpoint returns 501 placeholder.


### US-1.3 Language selector (EN default, PT/ES)
As a user, I want to switch language at any time so I can use the app in my preferred language.
Acceptance criteria:
- Default language is English.
- Options: Portuguese and Spanish.
- Language selector in the top-right of the header (Image 2).
- UI labels update immediately on change.
- Language preference is saved for future sessions.
Status: Implemented.
Implementation notes:
- Language selector (EN/PT/ES) with flags.
- Preference saved in local storage.


## Epic 2 - Portfolios and Institutions

### US-2.1 Global header and landing layout
As a user, I want a consistent header with navigation and profile access.
Acceptance criteria:
- Header includes sections: MyPortfolios, Investments, Banking Transactions, MyGoals.
- Portfolio Management (WIP) moved to the portfolio strip, left of the portfolio chips.
- Snapshot header action label updated to "Portfolio Import Data".
- Category management moved to its own tab (Categories) at the same level as Overview and Portfolio Import Data.
- Santander import no longer contains category add/remove/settings UI; uses shared Categories management.
- A login/profile icon is shown on the right.
- Landing page matches the layout in Image 1.
- Sections Stocks, Transactions, MyGoals, Portfolio Management are shown as WIP.
Status: Implemented.
Implementation notes:
- Landing page + login view as first screen.
- WIP pages for Stocks/Transactions/MyGoals/Portfolio Management.


### US-2.2 Portfolio selector bar
As a user, I want a horizontal portfolio selector so I can switch context quickly.
Acceptance criteria:
- A portfolio bar appears under the header (Image 2).
- Selected portfolio is visually highlighted.
- Header also shows the active portfolio name (e.g., "Portfolio RicFi").
Status: Implemented.
Implementation notes:
- Portfolio selector strip with active highlight.

### US-2.2a Portfolio sheets (Overview vs Management)
As a user, I want two sheets per portfolio so I can switch between analytics and imports.
Acceptance criteria:
- Two buttons in the portfolio header (next to Clear data): Overview and Portfolio Management.
- Delete portfolio button sits next to Clear data and removes the portfolio plus all its data after confirmation.
- Overview shows dashboard cards, charts, allocations, and institutions.
- Portfolio Management shows Import Snapshots (all importers).
Status: Implemented.
Implementation notes:
- Web: tabs live inside the portfolio strip; imports moved to management view.
- Mobile: tabs renamed to Overview / Portfolio management (imports tab).


### US-2.3 Create portfolio
As a user, I want to create a new portfolio with currency and institutions.
Acceptance criteria:
- Fields: name, currency (EUR, USD, GBP), institutions.
- Portfolio name must be unique.
- Default asset categories: Cash, Retirement Plan, Emergency Fund, Stocks.
- Custom asset categories can be created and reused.
- Currency selector uses the list pattern from Image 3.
Status: Implemented.
Implementation notes:
- Create portfolio with currency (EUR/USD/GBP) + custom categories.
- Clear data endpoint wipes portfolio imports.
- Delete portfolio endpoint removes the portfolio and all related data and category mappings.

### US-2.3a Investment category settings
As a user, I want to mark which asset categories count as investments, so KPIs only use investment data.
Acceptance criteria:
- Each category has a "counts as investment" toggle.
- Default: Cash is not an investment; all other categories default to investment.
- Toggles are available in both web and mobile.
- Settings affect invested totals and IRR.
Status: Implemented.
Implementation notes:
- Category settings stored per portfolio and applied in summary calculations.


### US-2.4 Santander import
As a user, I want to import a Santander Excel file and map assets to categories.
Acceptance criteria:
- Sections parsed: Contas, Poupancas, Cartoes de debito, Cartoes pre-pagos / Refeicao, Planos poupanca reforma (Image 4).
- Excel column A = asset name, column B = description, column C = balance.
- Only rows with A, B, C filled are configurable.
- Default asset categories pre-filled as in Image 5.
- User can override to a custom asset category per row.
- Invalid (non-Santander) files are rejected with a clear error message.
Status: Implemented.
Implementation notes:
- Accepts .xlsx/.xls with auto-preview on file select.
- Category mapping persisted across imports; Unknown can be ignored.
- Category create/remove/settings live in the Categories tab (shared across all imports).
- Mobile: Imports tab mirrors the preview + category mapping + save flow.


### US-2.5 XTB import
As a user, I want to import multiple XTB files and map each file to a category.
Acceptance criteria:
- Multiple files supported in a single import.
- Each file can be assigned a default or custom asset.
- Default asset category = Stocks.
- Parsing rules follow the MyFAInance v1 structure.
Status: Implemented.
Implementation notes:
- Multi-file import with filename prefix mapping (Broker/Beni/Magui). Preview does not show an Account column.
- Parses CASH OPERATION HISTORY (E8 current, D8 cash). Invested = abs(sum of column G for Stock purchase/sale rows).
- Profit sums column P values from OPEN POSITION sheets (excluding the last value).
- Default category = Stocks, with per-file category override.
- Append-only by file hash; preview on file select; per-import delete supported (red delete button with warning).
- Mobile: Multi-file picker + preview + save + delete per import.


### US-2.6 Trade Republic import
As a user, I want to import multiple Trade Republic files and map to a category.
Acceptance criteria:
- Multiple files supported in a single import.
- Category can be default or custom per file.
- Default asset category = Cash.
Status: Implemented.
Implementation notes:
- Accepts .pdf statements; preview extracts ending balance + sums interest payments.
- Invested computed as available cash minus interests; gains = interests received.
- Default category = Cash (uses last selected category if available).
- Append-only by file hash; per-import delete supported.
- Manual entry supported (Available Cash + Interests received) alongside file import.
- Manual entries stored as source=manual, use same invested/gains rules, and show in history.
- Manual entry allows category selection (defaults to last used category or Cash).
- Mobile: PDF picker + preview + category selection + save + delete per import + manual entry.


### US-2.7 AforroNet import
As a user, I want to import multiple AforroNet files and map to a category.
Acceptance criteria:
- Multiple files supported in a single import.
- Category can be default or custom per file.
- Default asset category = Emergency Funds.
Status: Implemented.
Implementation notes:
- Accepts .pdf and parses monthly statement lines (dd-mm-yyyy rows), summing units as invested and value as current.
- Snapshot date inferred from filename (dd-mm-yyyy).
- Default category = Emergency Funds; stored per import.
- Multi-file preview + batch save supported; append-only by file hash; per-import delete supported.
- Mobile: PDF picker + preview + category selection + save + delete per import.


### US-2.8 BancoInvest import
As a user, I want to import BancoInvest files and map each holder line to a category.
Acceptance criteria:
- Multiple files supported.
- Each line under "Titular" in "Plano Poupanca Reforma - Posicao Actual" is mapped (Image 6).
- Category can be default or custom per line.
- Default asset category = Retirement Plan.
Status: Implemented.
Implementation notes:
- Upload .xlsx/.xls and parse the table with TITULAR header.
- Current value from VALOR column; gains from VAR MOEDA.
- Invested = current value minus VAR MOEDA.
- Per-holder category mapping with persistence across imports; per-import delete supported.
- Mobile: File picker preview + category selection + save + delete per import.


### US-2.9 Save N Grow import
As a user, I want to import Save N Grow files and map each row under "TOTAL".
Acceptance criteria:
- Multiple files supported.
- Each row below "TOTAL" in column A is mapped (Image 7).
- Category can be default or custom per row.
- Default asset category = Retirement Plan.
Status: Implemented.
Implementation notes:
- Accepts .xlsx/.xls; rows below TOTAL parsed.
- Per-row category mapping; profit fallback if missing.
- Append-only by file hash.
- Mobile: File picker preview + per-row category selection + save (history list).


### US-2.10 Portfolio KPIs
As a user, I want to see key metrics at the top of the dashboard.
Acceptance criteria:
- Value, total profit, IRR, passive income cards (Image 8).
- Show invested value, daily change, and annual passive income.
Status: Partially implemented.
Implementation notes:
- Portfolio current value, invested (investment categories only), total profit computed from imports.
- IRR computed from first investment import date to today; passive income remains a placeholder.
- Overview totals now aggregate the latest import per institution (avoids hiding older sources when a newer import exists).


### US-2.11 Portfolio evolution chart
As a user, I want to see portfolio evolution over time.
Acceptance criteria:
- Line chart using snapshot history (Image 9).
- X-axis shows snapshot dates.
Status: Implemented.
Implementation notes:
- API aggregates totals by month (best-effort using snapshot_date/imported_at).
- Web + Mobile charts read `/portfolios/{id}/history/monthly`.


### US-2.12 Asset allocation chart
As a user, I want to see asset allocation by category.
Acceptance criteria:
- Donut chart with categories: Cash, Emergency Funds, Retirement Plans, Stocks (Image 9).
Status: Implemented.
Implementation notes:
- Pie/bar toggle with live allocation totals.


### US-2.13 Asset category cards
As a user, I want a category summary with totals and contributors.
Acceptance criteria:
- Cards show category total and percent (Image 10).
- Each card lists main institutions contributing.
Status: Implemented.
Implementation notes:
- Cards populated from live allocation totals.


### US-2.14 Institutions breakdown table
As a user, I want a table that breaks down institutions.
Acceptance criteria:
- Columns: Total per asset, Vs Last Month, Profit, Percent of profit.
- Rows per institution (Santander, Trade Republic, XTB, etc.).
- Optional Beni and Magui columns as shown in Image 10.
Status: Implemented.
Implementation notes:
- Dynamic institutions list from latest imports (Santander/Trade Republic/Save N Grow/XTB/BancoInvest/AforroNet).
- Vs last month computed from latest monthly snapshot; profit percent = gains / total.
- Beni/Magui columns derived from category totals (or XTB account types).
- Mobile: institutions breakdown list includes vs last month, profit %, Beni, Magui; tap opens detail modal.
- Mobile: tap an institution to open a detail modal (entries + category totals).
- Mobile: detail modal shows source/date and a category allocation donut.


### US-2.15 Past days breakdown
As a user, I want a table with historical snapshots.
Acceptance criteria:
- Table matches Image 11.
- Columns include totals and key categories per snapshot date.
Status: Implemented.
Implementation notes:
- Daily history endpoint aggregates totals + cash + emergency + invested.
- Web shows last 5 daily rows with change + % vs previous snapshot.
- Mobile shows a compact past days list with change + %.


### US-2.16 Snapshot history integration
As a user, I want all portfolio charts and tables to use snapshots.
Acceptance criteria:
- Snapshot history is the single source of truth for dashboards.
- All metrics update when a new snapshot is created.
Status: Partially implemented.
Implementation notes:
- Portfolio evolution + past days now use snapshot history.
- Summary KPIs now use the latest snapshot date instead of latest import.
- Institutions breakdown now uses the latest snapshot date.

## Epic 7 - My Holdings (Stocks/ETFs)

### US-7.1 Holdings table
As a user, I want to see all stock/ETF holdings in a single table.
Acceptance criteria:
- Holdings from Stocks-category imports and manual transactions appear in one table.
- View by portfolio or consolidated, with filters for category/institution/ticker.
- Each row shows ticker/name, shares, cost basis, current value, total profit, share in portfolio.
- Tooltips explain the metrics.
- A performance chart appears above the table with grouping + metric + range selectors.
Status: Implemented.
Implementation notes:
- Web: new "My Holdings" page with filters and table; consolidated view uses `/holdings`.
- Mobile: "My Holdings" tab mirrors the list, filters (including portfolio picker), and total value.
- Chart UI is available on web + mobile (group by ticker/sector/industry/country/asset type, metric, range).
- Holdings metadata (sector/industry/country/asset type) is stored per ticker and can be edited from the holdings list on web + mobile.

### US-7.2 Manual transaction entry
As a user, I want to add buy/sell transactions manually.
Acceptance criteria:
- Required fields: ticker, operation, date, shares, price.
- Optional: fee, note, company name, institution, category.
- Validations block empty ticker, shares/price <= 0, and missing date.
- Save and Save+add more options.
Status: Implemented.
Implementation notes:
- Web + Mobile forms call `/portfolios/{id}/holdings/transactions`.
- Transactions are appended (no overwrite) and immediately update holdings.

### US-7.3 Refresh prices
As a user, I want to refresh all holding prices.
Acceptance criteria:
- "Update all" button triggers price fetch.
- Uses price cache with TTL; forced refresh on button.
- Errors are visible in UI.
Status: Implemented.
Implementation notes:
- Web + Mobile call `/holdings/refresh-prices` (overall) or `/portfolios/{id}/holdings/refresh-prices`.
- Price provider configured via `PRICE_API_PROVIDER` (`twelvedata` or `finnhub`) and `PRICE_API_KEY`.
- Holdings list auto-fetches latest prices when cache is missing and `PRICE_API_KEY` is set; otherwise it falls back to import/avg price.

### US-7.4 Calculate holdings from transactions
As a user, I want the system to compute holdings from transactions.
Acceptance criteria:
- Buys and sells adjust shares and cost basis.
- Avg buy price and cost basis are recalculated.
- Holdings with 0 shares are omitted.
Status: Implemented.
Implementation notes:
- Server aggregates transactions per ticker and merges with imports.

### US-7.5 Import holdings from portfolio files
As a user, I want holdings to be created from stock broker imports.
Acceptance criteria:
- XTB OPEN POSITION rows become holdings (ticker, shares, open price).
- Category uses the selected import category (default Stocks).
- Imported holdings can be combined with manual transactions.
Status: Implemented.
Implementation notes:
- XTB preview returns `holdings`, commit persists to `holdings_imports` + `holdings_items`.
- Web + Mobile commit payloads include the holdings list.
- XTB holdings aggregate shares per ticker and use OPEN POSITION Purchase value for cost basis.
- If OPEN POSITION has Market price, it is stored as `current_price` and used as the default current value before price refresh.

### US-7.6 Metric tooltips
As a user, I want metric tooltips for holdings.
Acceptance criteria:
- Tooltips for Cost basis, Current value, Total profit, Share in portfolio.
Status: Implemented.
Implementation notes:
- Web shows inline tooltip popovers; Mobile uses alert dialogs.

### US-7.7 Consolidated view
As a user, I want a consolidated holdings view across portfolios.
Acceptance criteria:
- Aggregates holdings from all portfolios.
- Filters by portfolio, category, institution, ticker.
- Shows total value and share percent per holding.
Status: Implemented.
Implementation notes:
- `/holdings` endpoint aggregates portfolios and recalculates share percent.
- Web + Mobile expose a "Portfolio overall" view toggle.
- Mobile holdings list defaults to a collapsed row view; tap to expand full details.


## Epic 3 - Performance, Security, and Scalability

### US-3.1 Responsive and scalable UI
As a technical manager, I want the app to be responsive and scalable.
Acceptance criteria:
- Responsive layout for desktop and tablet (mobile later).
- Architecture supports horizontal scaling.
- Basic stress testing completed.
Status: Not implemented.
Implementation notes:
- No stress testing or scalability validation yet.


### US-3.2 Security baseline
As a technical manager, I want secure access and data protection.
Acceptance criteria:
- Passwords are hashed.
- Two-factor email verification.
- Protection against SQL injection and XSS.
- Input validation is enforced.
Status: Partially implemented.
Implementation notes:
- Passwords hashed, email verification, input validation in place.
- No dedicated XSS hardening beyond framework defaults.


## Epic 4 - Banking Transactions

### US-4.1 Import file or paste data
As a user, I want to import a file or paste transaction data, so I can add bank movements quickly.
Acceptance criteria:
- Accepts `.csv`, `.xls`, `.xlsx`.
- Paste input available as alternative to file upload.
- Preview flow before committing.
Status: Implemented.
Implementation notes:
- Web + Mobile support file selection and paste preview.
- Santander, Revolut, and ActivoBank formats validated in preview.


### US-4.2 Automatic column mapping + manual override
As a user, I want automatic column detection so I don't have to map fields manually.
Acceptance criteria:
- Date, description, amount, balance, debit/credit, currency detected.
- Manual override per column.
Status: Implemented.
Implementation notes:
- Header heuristic with normalized keywords.
- Mapping UI on preview (web + mobile).


### US-4.3 Select institution of origin
As a user, I want to associate transactions with a bank.
Acceptance criteria:
- Institution field required before commit.
- Institutions list is reused for filtering.
Status: Implemented.
Implementation notes:
- `banking_institutions` table + per-portfolio list.


### US-4.4 Persist and browse transactions
As a user, I want to store imported transactions and browse them with filters.
Acceptance criteria:
- Transactions saved with category/subcategory defaults.
- Filters by month, category, subcategory, institution.
Status: Implemented.
Implementation notes:
- `banking_transactions` table; filterable endpoint.
- Web + Mobile list with filter controls.
- Inline category edits update the transaction and refresh learned rules.
- Single macro + subcategory picker per transaction (web + mobile).


### US-4.5 Clear imported banking transactions
As a user, I want to clear imported banking transactions, so I can reset the list.
Acceptance criteria:
- Clear action deletes imports, transactions, and institutions for the portfolio.
- Requires confirmation.
Status: Implemented.
Implementation notes:
- `POST /portfolios/{id}/banking/clear` endpoint.
- Web + Mobile "Clear transactions" action.


### US-4.6 Categorização inteligente e aprendizagem
As a user, I want automatic categorization based on description and learn from corrections.
Status: Implemented (rule-based learning).
Implementation notes:
- `banking_category_rules` stores per-portfolio rules keyed by normalized description + institution.
- Imports apply exact-match rules to fill category/subcategory when defaults are used.
- Keyword pre-analysis assigns a default category/subcategory when no rule matches.
- Editing a transaction category updates the row and saves/updates the rule for future imports.


### US-4.7 Banking dashboard summary
As a user, I want a quick summary of my banking movements.
Acceptance criteria:
- Shows income, expenses, net, and top spending category.
- Updates based on the current filters.
Status: Implemented.
Implementation notes:
- Summary cards in Banking Transactions for web + mobile.

### US-4.8 Banking analytics charts
As a user, I want simple charts for my banking transactions.
Acceptance criteria:
- Spending by category chart (expenses only).
- Monthly net chart (income minus expenses).
- Updates after reclassifying a transaction.
Status: Implemented.
Implementation notes:
- Web uses bar charts with existing chart styles.
- Mobile shows bar rows for categories and monthly net.

### US-4.9 Budgets per category
As a user, I want to set monthly budgets per category so I can track spending limits.
Acceptance criteria:
- Create/update budget for a month + category with an amount.
- Budgets show spent, remaining, and percentage.
- Budgets update when transaction categories change.
- Budgets can be deleted.
Status: Implemented.
Implementation notes:
- Budgets stored in `banking_budgets` with month + category + amount.
- Web + Mobile budget forms with progress bars and delete actions.


## Future sections (WIP)
- Stocks
- MyGoals
- Portfolio Management
