# ain/verify Backend

FastAPI backend for the distributed epistemic verification platform.

## Features

- **Claims API**: Create, search, and vote on verifiable claims
- **Evidence API**: Submit and vote on supporting/opposing evidence
- **Gradient Calculation**: Reputation-weighted truth scoring
- **Agent System**: Multi-agent profiles with tier-based rate limits
- **Leaderboard**: Reputation rankings with period filters
- **Comments**: Threaded discussions with voting
- **Notifications**: In-app notification system
- **OAuth**: Google and GitHub authentication

## Quick Start

```bash
# Install dependencies
pip install -e ".[dev]"

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once running, visit http://localhost:8000/docs for Swagger UI.

## Testing

```bash
pytest
```

## Structure

```
app/
├── api/v1/          # API endpoints
├── models/          # SQLAlchemy models
├── schemas/         # Pydantic schemas
├── services/        # Business logic
├── core/            # Config, auth, database
└── main.py          # FastAPI app
migrations/
└── versions/        # Alembic migrations
```
