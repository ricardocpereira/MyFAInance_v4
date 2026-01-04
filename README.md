# MyFAInance v4

Personal finance portfolio tracker with a FastAPI backend, React web app, and React Native (Expo) mobile app.

## Repo layout
- `apps/api` — FastAPI backend (SQLite for local, PostgreSQL for production)
- `apps/web` — React web UI (Vite)
- `apps/mobile` — React Native (Expo) mobile app
- `packages/shared` — shared utilities/types

## Prerequisites
- Node.js + npm
- Python 3.11+ (venv)
- Git
- Docker (optional, for PostgreSQL)

## Setup
1) Install dependencies (root)
```
npm install
```

2) Backend env
Create `apps/api/.env` with your settings (example):
```
# Database - SQLite (local development)
DB_PATH=app.db

# SMTP Settings (optional for local dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your@gmail.com
SMTP_TLS=true
SMTP_SSL=false

# Price API (optional)
PRICE_API_PROVIDER=twelvedata
PRICE_API_KEY=your-key
PRICE_CACHE_TTL_MINUTES=60
```

3) Mobile env (API base)
Create `apps/mobile/.env`:
```
EXPO_PUBLIC_API_BASE=http://10.0.2.2:8000
```

## Run
### Backend
```
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --env-file .env
```

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
