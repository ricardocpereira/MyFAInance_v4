# MyFAInance v4

Personal finance portfolio tracker with advanced features including aggregated portfolio views, snapshot tracking, and multi-line performance charts.

**Version**: 4.0.0  
**Status**: Production Ready  
**Last Updated**: January 5, 2026

## 🎯 Key Features

### Portfolio Management
- ✅ Multiple portfolio support with individual tracking
- ✅ **Aggregated Portfolio View** - Combine all portfolios into unified view
- ✅ **Snapshot System** - Track portfolio evolution over time
- ✅ Category-based organization (Stocks, Bonds, Crypto, etc.)
- ✅ Multi-currency support (EUR, USD, etc.)

### Advanced Visualization
- ✅ **Multi-line Interactive Charts**:
  - Green solid line: Total portfolio value
  - Blue dashed line: Total invested amount
  - Yellow dotted line: Profit/Loss
- ✅ Hover tooltips with detailed metrics
- ✅ Axis labels with proper date and value formatting
- ✅ Color-coded legend for easy interpretation

### Investment Tracking
- ✅ Holdings management with real-time price updates
- ✅ Automatic price fetching from Yahoo Finance
- ✅ Tag system for categorization
- ✅ Import from multiple brokers (XTB, Trade Republic, Santander, etc.)
- ✅ Real Estate investment tracking (REITs and Rental Properties)

### Analytics & Insights
- ✅ FIRE (Financial Independence, Retire Early) calculator
- ✅ Budget tracking and alerts
- ✅ Debt management
- ✅ Institution/bank breakdown
- ✅ Performance metrics and profit/loss analysis

### Admin Features
- ✅ Ticker management backoffice
- ✅ Excel import/export for bulk operations
- ✅ Data enrichment tools

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI + Python 3.11+
- **Database**: SQLite (local) / PostgreSQL (production)
- **Frontend**: React 18 + TypeScript + Vite
- **Mobile**: React Native (Expo)
- **Charts**: Custom SVG implementation
- **Authentication**: JWT Bearer tokens

### Project Structure
```
MyFAInance_v4/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── app/
│   │   │   └── main.py        # Main API endpoints
│   │   ├── tests/             # Test suite
│   │   │   ├── test_aggregated_portfolio.py
│   │   │   ├── setup_tests.py
│   │   │   └── README.md
│   │   ├── requirements.txt
│   │   └── schema.sql
│   ├── web/                   # React web app
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── CockpitOverview.tsx    # Dashboard
│   │       │   ├── Portfolios.tsx         # Portfolio management
│   │       │   ├── Holdings.tsx           # Holdings view
│   │       │   ├── RealEstate.tsx         # Real estate tracking
│   │       │   └── AdminBackoffice.tsx    # Admin panel
│   │       └── App.tsx
│   └── mobile/                # React Native app
├── docs/
│   ├── CHANGELOG.md           # Version history
│   ├── AGGREGATED_PORTFOLIO.md # Feature documentation
│   ├── API_TESTING.md         # Testing guide
│   └── v2-user-stories.md
└── packages/
    └── shared/                # Shared utilities
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.11+
- **Git**
- Docker (optional, for PostgreSQL)

### 1. Clone Repository
```bash
git clone https://github.com/ricardocpereira/MyFAInance_v4.git
cd MyFAInance_v4
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Backend Setup
```bash
cd apps/api
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

Create `apps/api/.env`:
```env
# Database - SQLite (local development)
DB_PATH=portfolio_tracker.db

# SMTP Settings (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your@gmail.com

# Price API (optional)
PRICE_API_PROVIDER=twelvedata
PRICE_API_KEY=your-key
```

Start API server:
```bash
uvicorn app.main:app --reload --port 8000
```

API will be available at: `http://127.0.0.1:8000`

### 4. Web Frontend Setup
```bash
cd apps/web
npm install
npm run dev
```

Web app will be available at: `http://localhost:5173`

### 5. Mobile Setup (Optional)
```bash
cd apps/mobile

# Create .env
echo "EXPO_PUBLIC_API_BASE=http://10.0.2.2:8000" > .env

npm install
npm start
```

## 🧪 Testing

### Setup Test Environment
```bash
cd apps/api
python tests/setup_tests.py
```

### Run Tests
```bash
# All tests
pytest tests/test_aggregated_portfolio.py -v

# With coverage
pytest tests/test_aggregated_portfolio.py --cov=app --cov-report=html -v

# Specific test class
pytest tests/test_aggregated_portfolio.py::TestSnapshots -v
```

### Manual API Testing
```bash
# Get auth token
TOKEN=$(curl -s -X POST "http://127.0.0.1:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}' \
  | jq -r '.access_token')

# Test aggregated portfolio
curl -X GET "http://127.0.0.1:8000/portfolios/aggregated/summary" \
  -H "Authorization: Bearer ${TOKEN}"

# Create snapshot
curl -X POST "http://127.0.0.1:8000/portfolios/aggregated/snapshot" \
  -H "Authorization: Bearer ${TOKEN}"
```

See [API Testing Guide](docs/API_TESTING.md) for complete testing documentation.

## 📖 Documentation

### User Guides
- [Changelog](docs/CHANGELOG.md) - Version history and features
- [Aggregated Portfolio Guide](docs/AGGREGATED_PORTFOLIO.md) - Feature deep dive

### Developer Guides
- [API Testing](docs/API_TESTING.md) - Complete testing guide
- [Test Suite README](apps/api/tests/README.md) - Quick test reference

### API Documentation
Once the server is running, visit:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

## 🔑 Key Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Portfolios
- `GET /portfolios` - List user portfolios
- `GET /portfolios/{id}/summary` - Get portfolio summary
- `POST /portfolios` - Create new portfolio

### Aggregated Portfolio
- `GET /portfolios/aggregated/summary` - Get combined portfolio summary
- `POST /portfolios/aggregated/snapshot` - Create snapshot
- `GET /portfolios/aggregated/snapshots` - List all snapshots
- `DELETE /portfolios/aggregated/snapshots/{id}` - Delete snapshot
- `DELETE /portfolios/aggregated/snapshots` - Clear all snapshots

### Holdings
- `GET /portfolios/{id}/holdings` - List holdings
- `POST /portfolios/{id}/holdings/prices` - Update prices
- `POST /portfolios/{id}/holdings/{holding_id}/tags` - Add tags

## 🎨 Features in Detail

### Aggregated Portfolio
The aggregated portfolio (ID: -1) combines all user portfolios into a single view:
- **Summary**: Total value, invested, profit across all portfolios
- **Snapshots**: Time-series tracking with manual snapshot creation
- **Charts**: Multi-line visualization with total, invested, and profit lines
- **Breakdown**: Sub-portfolio card showing individual portfolio performance

### Snapshot System
Track portfolio evolution over time:
- Create snapshots with editable dates (backfill historical data)
- View snapshot history in table format
- Delete individual or clear all snapshots
- Automatic chart integration for visualization
- Stores: total_value, total_invested, total_profit, profit_percent, categories

### Interactive Charts
- **Three Lines**: Total (green solid), Invested (blue dashed), Profit (yellow dotted)
- **Tooltips**: Hover to see detailed values
- **Axis Labels**: Y-axis in k€, X-axis with dates
- **Legend**: Color-coded for easy reading
- **Responsive**: Adapts to screen size

### Real Estate Tracking
Separate section for real estate investments:
- **REITs**: REIT holdings with dividend tracking
- **Rental Properties**: Property management and income tracking
- **Monthly Income**: Combined income calculation
- **Cockpit Integration**: Real Estate Income card in dashboard

## 🔒 Security

- JWT Bearer token authentication
- Ownership validation on all operations
- SQL injection prevention via parameterized queries
- Password hashing with SHA-256
- HTTPS recommended for production

## 🚢 Deployment

### Backend (Docker)
```bash
cd apps/api
docker build -t myfainance-api .
docker run -p 8000:8000 -v $(pwd)/data:/app/data myfainance-api
```

### Frontend (Static Build)
```bash
cd apps/web
npm run build
# Deploy dist/ folder to static hosting (Vercel, Netlify, etc.)
```

### Database Migration
For PostgreSQL in production:
1. Update `.env` with PostgreSQL connection string
2. Run schema from `apps/api/schema.sql`
3. Update code to use PostgreSQL connection

## 📊 Database Schema

### Key Tables
- `users` - User accounts
- `portfolios` - Individual portfolios
- `holdings` - Investment holdings
- `aggregated_snapshots` - Portfolio snapshots
- `goals` - FIRE goals
- `debts` - Debt tracking
- `budgets` - Budget management

See [schema.sql](apps/api/schema.sql) for complete schema.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is private and proprietary.

## 👤 Author

**Ricardo Pereira**
- GitHub: [@ricardocpereira](https://github.com/ricardocpereira)

## 🙏 Acknowledgments

- Development assistance by Claude AI
- Chart inspiration from various financial apps
- Community feedback and testing

---

**Version**: 4.0.0  
**Last Updated**: January 5, 2026  
**Status**: ✅ Production Ready

### Web
```
cd apps/web
npm run dev
```

### Mobile (Expo)
```
cd apps/mobile
npm run start
```
Press `a` for Android emulator or `i` for iOS simulator.

## PostgreSQL (Production)

For production deployment with multiple users, use PostgreSQL:

1) Start PostgreSQL with Docker:
```
cd apps/api
docker-compose up -d
```

2) Update `.env`:
```
DATABASE_URL=postgresql://myfainance:myfainance@localhost:5432/myfainance
```

3) Run migrations (coming soon)

**Note:** PostgreSQL migration requires code updates (10000+ lines). SQLite is fully functional for local development and single-user deployments.

## Notes
- SQLite DB lives at `apps/api/app.db` (ignored by git).
- `.env` files are ignored; keep secrets out of git.
- For production with multiple users, migrate to PostgreSQL (see `apps/api/schema.sql` and `docker-compose.yml`).
