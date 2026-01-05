# MyFAInance v4 - Changelog

## Version 4.0.0 (January 2026)

### 🎉 Major Features

#### 1. Aggregated Portfolio System
- **Aggregated Portfolio View**: Combines all user portfolios into a single view with ID -1
- **Snapshot System**: Track portfolio evolution over time with manual snapshots
  - Create snapshots with editable dates (YYYY-MM-DD format)
  - View snapshot history in tabular format
  - Delete individual snapshots or clear all at once
  - Automatic snapshot creation via API or UI button
- **Backend Endpoints**:
  - `GET /portfolios/aggregated/summary` - Get combined portfolio summary
  - `POST /portfolios/aggregated/snapshot` - Create snapshot with optional date
  - `GET /portfolios/aggregated/snapshots` - List all user snapshots
  - `DELETE /portfolios/aggregated/snapshots/{snapshot_id}` - Delete single snapshot
  - `DELETE /portfolios/aggregated/snapshots` - Clear all snapshots
- **Database**: New `aggregated_snapshots` table with UNIQUE constraint on (owner_email, snapshot_date)

#### 2. Enhanced Portfolio Performance Chart
- **Multi-line Visualization**:
  - 🟢 Green solid line - Total portfolio value
  - 🔵 Blue dashed line - Total invested amount
  - 🟡 Yellow dotted line - Profit/Loss
- **Interactive Tooltips**: Hover over chart to see detailed values at each point
- **Axis Labels**: 
  - Y-axis with values in k€ format
  - X-axis with dates (MM/YY or DD/MM for snapshots)
- **Legend**: Color-coded legend showing which line represents which metric
- **Responsive Design**: Chart adapts to container size while maintaining proportions
- **Fallback**: Shows horizontal line at current value when no historical data exists

#### 3. Admin Backoffice
- **Ticker Management**: Upload and manage stock ticker data
- **Excel Template**: Download template for ticker enrichment
- **Bulk Operations**: Import tickers from Excel with validation
- **Data Enrichment**: Add sector, industry, country, and currency information
- **Protected Route**: Admin-only access with authentication

#### 4. Holdings Page Enhancements
- **Enhanced Grid Display**: Card-based layout for each holding
- **Import Buttons**: 
  - XTB broker import
  - Trade Republic import
  - Santander import
  - Banco Invest import
  - Aforronet import
  - SaveNGrow import
- **Price Updates**: Automatic price fetching from Yahoo Finance
- **Tag Management**: Add custom tags to holdings for categorization
- **Real-Time Calculations**: Live profit/loss calculations
- **Real Estate Navigation**: Button to access Real Estate investments section

#### 5. Real Estate Investment Tracking
- **New Page**: Dedicated Real Estate section with 3 tabs
- **Overall Tab**: 
  - Combined monthly income from all real estate sources
  - Total: 1000€/month (WIP)
- **REITs Tab**:
  - Total REIT count
  - YTD received dividends (WIP)
  - Monthly average income: 200€
  - REIT logo visualization
- **Rental Properties Tab**:
  - Property count and details (WIP)
  - Monthly rental income: 800€
  - Home icon visualization
- **Cockpit Integration**: Real Estate Income card showing breakdown

#### 6. Cockpit Dashboard Improvements
- **Portfolios Breakdown Card**: 
  - Shows individual portfolio summaries when viewing aggregated portfolio
  - Displays name, total value, profit/loss with color coding
  - Conditional rendering (only for aggregated view)
- **Real Estate Income Card**:
  - Total monthly income display
  - Breakdown by source (REITs and Rental Properties)
  - Visual icons for each category
  - WIP status indicators
- **Enhanced Performance Card**:
  - Larger chart (280px height)
  - Multi-line visualization with legend
  - Better axis labeling
- **Sub-portfolios Card** (Institutions):
  - Hidden for aggregated portfolio
  - Shows bank/institution breakdown for individual portfolios

### 🔧 Technical Improvements

#### Backend (FastAPI)
- **New Database Tables**:
  - `aggregated_snapshots`: Stores portfolio snapshots over time
  - Added indexes for performance optimization
- **Aggregation Logic**:
  - Combines data from multiple portfolios
  - Handles different currencies (future enhancement)
  - Calculates totals by category
- **Error Handling**: Improved error messages and validation
- **Ownership Security**: All snapshot operations verify user ownership
- **Data Validation**: 
  - Date format validation (YYYY-MM-DD)
  - Duplicate snapshot prevention via UNIQUE constraint
  - INSERT OR REPLACE for snapshot updates

#### Frontend (React + TypeScript)
- **New Components**:
  - `RealEstate.tsx`: Real estate investment tracking
  - `AdminBackoffice.tsx`: Admin panel for ticker management
- **Enhanced Components**:
  - `CockpitOverview.tsx`: Multi-line charts, new cards, conditional rendering
  - `Portfolios.tsx`: Snapshot management UI
  - `Holdings.tsx`: Import buttons, enhanced layout
  - `App.tsx`: New routes, snapshot creation dialog
- **State Management**:
  - Added portfolios list to Cockpit for sub-portfolio summaries
  - Snapshot state management in Portfolios page
  - Tooltip state for chart interactions
- **CSS Improvements**:
  - New grid layouts for cards
  - Responsive design improvements
  - Color-coded elements for profit/loss
  - Chart styling with proper aspect ratios

### 🐛 Bug Fixes
- Fixed KeyError: 'categories_json' in aggregated portfolio summary
- Fixed chart aspect ratio preventing text stretching
- Fixed CSS stroke override forcing all lines to be green
- Fixed Real Estate card overlapping issue in grid layout
- Fixed chart not displaying on login when no historical data
- Fixed duplicate "Sub-portfolios" sections in Cockpit
- Added missing CSS for `cockpit-subportfolios-summary` card

### 📝 Data Flow

#### Aggregated Portfolio Workflow
1. User clicks "Aggregated Portfolio" button
2. Frontend sets portfolio to synthetic object with ID -1
3. Backend aggregates all user portfolios via `_list_portfolios()`
4. Summary endpoint returns combined totals and categories
5. Snapshots endpoint returns time-series data for charts
6. Chart displays with 3 lines when invested/profit data available

#### Snapshot Creation Workflow
1. User clicks "Create Snapshot" button
2. Dialog prompts for date (defaults to today)
3. Frontend validates YYYY-MM-DD format
4. POST to `/portfolios/aggregated/snapshot?snapshot_date=YYYY-MM-DD`
5. Backend calculates current totals from all portfolios
6. Inserts/updates snapshot in database (UNIQUE constraint)
7. Returns success/error response
8. Frontend refreshes snapshot list

### 🧪 Testing
- Manual testing completed for all new features
- Database integrity verified with UNIQUE constraints
- Cross-browser testing on major browsers
- Mobile responsiveness verified
- Error handling tested with invalid inputs

### 📊 Database Schema Changes

```sql
-- New table for aggregated portfolio snapshots
CREATE TABLE IF NOT EXISTS aggregated_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_email TEXT NOT NULL,
    snapshot_date TEXT NOT NULL,
    total_value REAL NOT NULL,
    total_invested REAL NOT NULL,
    total_profit REAL NOT NULL,
    profit_percent REAL NOT NULL,
    totals_by_category_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(owner_email, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_aggregated_snapshots_owner 
ON aggregated_snapshots(owner_email);

CREATE INDEX IF NOT EXISTS idx_aggregated_snapshots_date 
ON aggregated_snapshots(snapshot_date);
```

### 🔐 Security
- All endpoints require authentication via Bearer token
- Ownership validation on all CRUD operations
- SQL injection prevention via parameterized queries
- Admin routes protected with role verification

### 🚀 Performance
- Parallel loading of sub-portfolio summaries
- Efficient database queries with proper indexes
- Memoized calculations for chart paths
- Conditional rendering to minimize DOM updates

### 📱 UI/UX Improvements
- Intuitive snapshot management interface
- Visual feedback for all operations
- Color-coded profit/loss indicators
- Responsive grid layouts
- Interactive chart with tooltips
- Clear navigation between sections

### 🎨 Design System
- Consistent color scheme:
  - Green (#2ad68d): Positive values, total line
  - Blue (#4dabf7): Invested amounts
  - Yellow (#ffd43b): Profit/loss line
  - Red: Negative values, delete actions
- Card-based layouts with shadows
- Gradient backgrounds for depth
- Icon integration for visual clarity

### 📦 Dependencies
No new production dependencies added. Using existing stack:
- React 18+
- TypeScript
- Vite
- FastAPI
- SQLite

### 🔄 Migration Notes
- Automatic database migration on first run
- No manual intervention required
- Existing data preserved
- New tables created automatically

### 🎯 Future Enhancements
- Real Estate backend integration with actual data
- REIT dividend calculation from holdings
- Rental property management features
- Multi-currency support for aggregated portfolios
- Export snapshots to CSV/Excel
- Scheduled automatic snapshots
- Chart line toggles (show/hide individual lines)
- Advanced filtering and date range selection

### 👥 Contributors
- Development by Claude AI Assistant
- Testing and requirements by ricardocpereira

---

**Note**: This version represents a major milestone in MyFAInance evolution, bringing enterprise-level portfolio tracking capabilities with intuitive user interface and robust backend architecture.
