# Aggregated Portfolio Feature

## Overview
The Aggregated Portfolio feature allows users to view and track the combined performance of all their portfolios in a single unified view. This feature is essential for users managing multiple investment accounts who want a holistic view of their total wealth.

## Architecture

### Frontend Implementation

#### Synthetic Portfolio Object
The aggregated portfolio is represented as a synthetic object with special ID `-1`:

```typescript
{
  id: -1,
  name: "Aggregated Portfolio",
  currency: "EUR",
  categories: []
}
```

This special ID is used throughout the application to differentiate aggregated views from individual portfolio views.

#### Key Components

**App.tsx**
- Creates synthetic portfolio object when "Aggregated Portfolio" button is clicked
- Handles snapshot creation via dialog prompt
- Provides scroll-to-snapshots functionality

**CockpitOverview.tsx**
- Conditional endpoint selection based on portfolio ID
- Loads snapshots instead of monthly history for aggregated view
- Displays Portfolios Breakdown card (only for ID -1)
- Hides institutions card for aggregated view

**Portfolios.tsx**
- Displays snapshot history table for aggregated portfolio
- Provides delete and clear-all functionality
- Shows chart with snapshot data points

### Backend Implementation

#### Database Schema

```sql
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
```

**Key Design Decisions:**
- `UNIQUE(owner_email, snapshot_date)`: Prevents duplicate snapshots for the same date
- `snapshot_date`: TEXT field for flexible date handling (YYYY-MM-DD format)
- `totals_by_category_json`: JSON string storing category breakdown
- `created_at`: Timestamp for audit trail

#### API Endpoints

##### 1. Get Aggregated Summary
```
GET /portfolios/aggregated/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "total": 15000.50,
  "total_invested": 12000.00,
  "total_profit": 3000.50,
  "profit_percent": 25.0,
  "categories": [
    {
      "category_name": "Stocks",
      "total": 10000.00,
      "percentage": 66.67
    }
  ]
}
```

**Implementation Logic:**
1. Fetch all user portfolios via `_list_portfolios()`
2. Aggregate `total`, `total_invested`, `total_profit` across portfolios
3. Calculate weighted `profit_percent`
4. Combine categories using `_aggregate_latest_totals()`
5. Return unified summary

##### 2. Create Snapshot
```
POST /portfolios/aggregated/snapshot?snapshot_date=2026-01-05
Authorization: Bearer <token>
```

**Parameters:**
- `snapshot_date` (optional): YYYY-MM-DD format, defaults to current date

**Response:**
```json
{
  "id": 123,
  "snapshot_date": "2026-01-05",
  "total_value": 15000.50,
  "message": "Snapshot created successfully"
}
```

**Implementation Logic:**
1. Validate date format (YYYY-MM-DD)
2. Call `aggregated_portfolio_summary()` to get current totals
3. Use `INSERT OR REPLACE` to handle duplicates
4. Return snapshot details

**SQL Query:**
```sql
INSERT OR REPLACE INTO aggregated_snapshots (
    owner_email, snapshot_date, total_value, total_invested,
    total_profit, profit_percent, totals_by_category_json, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
```

##### 3. List Snapshots
```
GET /portfolios/aggregated/snapshots
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "snapshot_date": "2026-01-01",
      "total_value": 14000.00,
      "total_invested": 12000.00,
      "total_profit": 2000.00,
      "profit_percent": 16.67,
      "created_at": "2026-01-01T10:30:00"
    }
  ]
}
```

**Implementation Logic:**
1. Query all snapshots for authenticated user
2. Order by `snapshot_date DESC`
3. Return as array of objects

##### 4. Delete Single Snapshot
```
DELETE /portfolios/aggregated/snapshots/{snapshot_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Snapshot deleted successfully"
}
```

**Security:**
- Verifies snapshot belongs to authenticated user
- Returns 404 if snapshot not found or doesn't belong to user

##### 5. Clear All Snapshots
```
DELETE /portfolios/aggregated/snapshots
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "All snapshots cleared successfully",
  "deleted_count": 5
}
```

## Data Flow

### Snapshot Creation Flow
```
User clicks "Create Snapshot"
    ↓
Dialog prompts for date (default: today)
    ↓
Validate YYYY-MM-DD format
    ↓
POST /portfolios/aggregated/snapshot?snapshot_date=YYYY-MM-DD
    ↓
Backend aggregates current portfolio data
    ↓
INSERT OR REPLACE into aggregated_snapshots
    ↓
Return success response
    ↓
Frontend refreshes snapshot list
    ↓
Chart updates with new data point
```

### Chart Data Flow
```
User selects Aggregated Portfolio (ID -1)
    ↓
CockpitOverview detects portfolio.id === -1
    ↓
Loads snapshots from /portfolios/aggregated/snapshots
    ↓
Converts snapshots to chart series format
    ↓
Each snapshot becomes data point: {month, total, invested, profit}
    ↓
Chart renders 3 lines with tooltips
    ↓
User hovers → tooltip shows all values
```

## Key Features

### 1. Multi-line Chart
- **Total Line**: Green solid line showing total portfolio value
- **Invested Line**: Blue dashed line showing cumulative investments
- **Profit Line**: Yellow dotted line showing profit/loss over time

### 2. Interactive Tooltips
- Displays on hover over any chart line
- Shows date and all three metrics
- Color-coded values matching line colors
- Positioned dynamically to avoid edge clipping

### 3. Snapshot Management
- **Create**: Button in navbar with date prompt
- **View**: Table showing all snapshots with full details
- **Delete**: Per-row delete button with confirmation
- **Clear All**: Bulk delete with confirmation
- **Navigate**: Smooth scroll to snapshot section

### 4. Conditional Rendering
Components that behave differently for aggregated portfolio:

**CockpitOverview:**
- Uses `/portfolios/aggregated/summary` instead of `/portfolios/{id}/summary`
- Loads snapshots instead of monthly history
- Hides institutions card
- Shows Portfolios Breakdown card

**Portfolios Page:**
- Shows snapshot table instead of daily history
- Uses full date format (DD/MM/YY) instead of month/year
- Includes invested and profit columns

## Error Handling

### Backend
- **Invalid Date Format**: Returns 400 Bad Request
- **Database Error**: Returns 500 Internal Server Error
- **Unauthorized**: Returns 401 if token invalid
- **Not Found**: Returns 404 for non-existent snapshots
- **Duplicate Prevention**: UNIQUE constraint prevents duplicates, INSERT OR REPLACE updates existing

### Frontend
- **Invalid Date**: Alert message with format requirements
- **API Error**: Displays error message in UI
- **Empty State**: Shows "No snapshots available" message
- **Loading State**: Displays loading indicators during API calls

## Performance Considerations

### Database Optimization
- Indexes on `owner_email` and `snapshot_date` for fast queries
- UNIQUE constraint prevents duplicates at database level
- Limited columns to minimize storage

### Frontend Optimization
- Memoized chart calculations (useMemo)
- Conditional rendering to avoid unnecessary DOM updates
- Efficient date parsing and formatting
- Parallel loading of sub-portfolio summaries

### Chart Rendering
- SVG-based for performance and scalability
- Path calculations cached via useMemo
- Tooltip state minimized to essential data
- Event handlers optimized for mousemove performance

## Testing Scenarios

### Manual Testing Checklist
- ✅ Create snapshot with current date
- ✅ Create snapshot with past date
- ✅ Create snapshot with future date
- ✅ Create duplicate snapshot (should update existing)
- ✅ View snapshot list
- ✅ Delete single snapshot
- ✅ Clear all snapshots
- ✅ Chart displays correctly with 1 snapshot
- ✅ Chart displays correctly with multiple snapshots
- ✅ Chart displays correctly with no snapshots (fallback)
- ✅ Tooltip shows correct values on hover
- ✅ Switch between individual and aggregated portfolios
- ✅ Verify ownership validation (cannot delete other users' snapshots)

### Edge Cases
- User with no portfolios → Empty aggregated view
- User with one portfolio → Aggregated equals individual
- Snapshot on same date as portfolio creation
- Very old snapshots (historical data)
- Many snapshots (performance test)
- Concurrent snapshot creation from multiple sessions

## Future Enhancements

### Planned Features
1. **Automatic Snapshots**: Scheduled daily/weekly/monthly snapshots
2. **Export**: Download snapshots as CSV/Excel
3. **Import**: Bulk import historical snapshots
4. **Comparison**: Compare snapshots side-by-side
5. **Alerts**: Notifications on significant value changes
6. **Multi-Currency**: Handle portfolios in different currencies
7. **Backup**: Snapshot backup and restore functionality

### Technical Improvements
1. **Caching**: Cache aggregated calculations
2. **Pagination**: For users with many snapshots
3. **Compression**: Compress category JSON for large datasets
4. **Webhooks**: Trigger external actions on snapshot creation
5. **API Versioning**: Maintain backward compatibility

## Troubleshooting

### Common Issues

**Issue**: Chart not displaying
- **Cause**: No snapshots exist for aggregated portfolio
- **Solution**: Chart shows fallback horizontal line at current value

**Issue**: Duplicate snapshot error
- **Cause**: Trying to create snapshot on existing date
- **Solution**: Uses INSERT OR REPLACE to update existing snapshot

**Issue**: Missing invested/profit lines
- **Cause**: Snapshots created before feature implementation
- **Solution**: Recreate snapshots to include new data fields

**Issue**: Tooltips not appearing
- **Cause**: Mouse events not registering
- **Solution**: Check z-index and pointer-events CSS properties

## Security Considerations

### Authentication
- All endpoints require valid Bearer token
- Token verified on every request
- User email extracted from token for ownership validation

### Authorization
- Users can only view/modify their own snapshots
- Snapshot ownership verified before delete operations
- SQL injection prevented via parameterized queries

### Data Privacy
- Snapshots stored per user (owner_email)
- No cross-user data exposure
- Aggregate calculations done server-side

## Maintenance

### Database Maintenance
```sql
-- Clean up old snapshots (optional)
DELETE FROM aggregated_snapshots 
WHERE snapshot_date < date('now', '-1 year');

-- Verify data integrity
SELECT owner_email, COUNT(*) as snapshot_count 
FROM aggregated_snapshots 
GROUP BY owner_email;

-- Check for orphaned snapshots
SELECT * FROM aggregated_snapshots 
WHERE owner_email NOT IN (SELECT email FROM users);
```

### Monitoring
- Track snapshot creation frequency
- Monitor database size growth
- Alert on API endpoint failures
- Log aggregation errors for debugging

---

**Last Updated**: January 5, 2026
**Version**: 4.0.0
**Status**: Production Ready
