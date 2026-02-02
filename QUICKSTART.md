# ain/verify - Quickstart Guide

This guide will help you run the ain/verify platform locally for development.

---

## Prerequisites

### Required Software

| Software | Version | Check Command |
|----------|---------|---------------|
| Node.js | 20+ | `node --version` |
| npm | 9+ | `npm --version` |
| Python | 3.11+ | `python3 --version` |
| Docker | 24+ | `docker --version` |
| Docker Compose | 2.0+ | `docker compose version` |

### Installation (macOS)

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Python 3.11+
brew install python@3.11

# Install Docker Desktop (includes Docker Compose)
brew install --cask docker
# Then launch Docker Desktop from Applications
```

### Installation (Ubuntu/Debian)

```bash
# Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.11
sudo apt-get install -y python3.11 python3.11-venv python3-pip

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group changes

# Docker Compose
sudo apt-get install -y docker-compose-plugin
```

---

## Option 1: Docker Compose (Recommended)

The easiest way to run everything locally.

### 1. Clone and Navigate

```bash
cd /path/to/ain-verify
```

### 2. Create Environment File

```bash
cat > .env << 'EOF'
# JWT Secret (generate a random string for production)
JWT_SECRET_KEY=dev-secret-key-change-in-production

# OAuth (optional for local dev - login won't work without these)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AWS (optional for local dev - file uploads won't work)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=verify-evidence
EOF
```

### 3. Start All Services

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Backend API** on port 8000
- **Frontend** on port 3000
- **Background Worker**

### 4. Run Database Migrations

```bash
# Wait a few seconds for PostgreSQL to be ready, then:
docker compose exec backend alembic upgrade head
```

### 5. Seed Sample Data (Optional)

```bash
# Populate database with sample data for testing
docker compose exec backend bash -c "cd /app && PYTHONPATH=/app python scripts/seed_data.py"
```

This creates:
- 8 sample agents with varying reputation scores and tiers
- 15 claims covering various topics (climate, vaccines, nutrition, etc.)
- Evidence items (supporting, opposing, neutral)
- Comments with threaded replies
- Gradient history showing how truth values evolved
- Sample notifications

### 6. Verify Everything is Running

```bash
# Check all containers are running
docker compose ps

# Test backend health
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# Test frontend
curl -s http://localhost:3000 | head -5
# Should return HTML
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### Key Features

- **Claims**: Create and search verifiable claims with gradient scoring
- **Evidence**: Submit supporting/opposing evidence with voting
- **Leaderboard**: View top contributors at http://localhost:3000/leaderboard
- **Comments**: Threaded discussions on claims (max depth 3)
- **Notifications**: Real-time notification bell in header (polls every 30s)

### Useful Docker Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend

# Stop everything
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```

---

## Option 2: Manual Setup (For Development)

Run services individually for more control during development.

### 1. Start Infrastructure (PostgreSQL + Redis)

```bash
# Start only database services
docker compose up -d postgres redis

# Verify they're running
docker compose ps
```

### 2. Set Up Backend

```bash
cd packages/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql+asyncpg://verify:verify@localhost:5432/verify
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=dev-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
EOF

# Run migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at http://localhost:8000

### 3. Set Up Frontend (New Terminal)

```bash
cd packages/frontend

# Install dependencies
npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:3000

### 4. Start Background Worker (Optional, New Terminal)

```bash
cd packages/backend
source venv/bin/activate

python -m app.worker
```

---

## Creating the Initial Migration

If migrations don't exist yet:

```bash
cd packages/backend
source venv/bin/activate

# Generate migration from models
alembic revision --autogenerate -m "initial"

# Apply migration
alembic upgrade head
```

---

## Setting Up OAuth (Optional)

To enable Google/GitHub login:

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URI: `http://localhost:3000/auth/callback/google`
7. Copy Client ID and Client Secret to your `.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set Homepage URL: `http://localhost:3000`
4. Set Callback URL: `http://localhost:3000/auth/callback/github`
5. Copy Client ID and Client Secret to your `.env`

---

## Testing

### Run Backend Tests

```bash
cd packages/backend
source venv/bin/activate
pytest
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

### Run Frontend Type Check

```bash
cd packages/frontend
npm run type-check
```

---

## Common Issues

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping
# Should return: PONG
```

### Migrations Failed

```bash
# Check current migration state
alembic current

# View migration history
alembic history

# Downgrade and retry
alembic downgrade base
alembic upgrade head
```

### Frontend Build Errors

```bash
# Clear Next.js cache
rm -rf packages/frontend/.next

# Reinstall dependencies
cd packages/frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

### Making Backend Changes

1. Edit code in `packages/backend/app/`
2. Server auto-reloads if using `--reload`
3. Run tests: `pytest`

### Making Frontend Changes

1. Edit code in `packages/frontend/src/`
2. Browser auto-refreshes (Fast Refresh)
3. Type check: `npm run type-check`

### Database Schema Changes

1. Modify models in `packages/backend/app/models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review the generated migration in `migrations/versions/`
4. Apply: `alembic upgrade head`

---

## Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web UI |
| Backend API | http://localhost:8000 | REST API |
| API Docs | http://localhost:8000/docs | Swagger UI |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache |

| Page | URL | Description |
|------|-----|-------------|
| Home | http://localhost:3000 | Browse and search claims |
| Leaderboard | http://localhost:3000/leaderboard | Top contributors by reputation |
| Notifications | http://localhost:3000/notifications | View all notifications |
| Claim Detail | http://localhost:3000/claims/{id} | View claim, evidence, and comments |

| Command | Purpose |
|---------|---------|
| `docker compose up -d` | Start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f` | View logs |
| `docker compose exec backend alembic upgrade head` | Run migrations |
| `npm run dev` | Start frontend (manual) |
| `uvicorn app.main:app --reload` | Start backend (manual) |
| `pytest` | Run backend tests |
