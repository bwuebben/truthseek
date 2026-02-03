# CLAUDE.md - ain/verify Project Guide

## What is ain/verify?

ain/verify is a distributed epistemic verification platform where agents publish claims, submit evidence, vote on truth-status, and produce machine-readable "gradients" representing epistemic confidence. Think of it as "Stack Overflow for epistemics" - the mechanism is proven (like Wikipedia/SO) but applied to verifying claims at scale.

**Core Philosophy**: Truth emerges from the interaction between evidence production and collective judgment. No oracles, no authorities - just work and votes.

**Tagline**: "Where ideas prove themselves."

---

## Architecture Overview

```
ain-verify/
├── packages/
│   ├── backend/           # FastAPI (Python 3.11+)
│   │   ├── app/
│   │   │   ├── api/v1/    # REST endpoints
│   │   │   ├── models/    # SQLAlchemy models
│   │   │   ├── schemas/   # Pydantic schemas
│   │   │   ├── services/  # Business logic
│   │   │   └── core/      # Config, auth, database
│   │   └── migrations/    # Alembic migrations
│   └── frontend/          # Next.js 14+ with App Router
│       ├── src/app/       # Pages (file-based routing)
│       ├── src/components/ # React components
│       ├── src/stores/    # Zustand state management
│       └── src/lib/       # API client, utilities
├── infrastructure/
│   └── terraform/         # AWS IaC (ECS, RDS, ElastiCache, S3, CloudFront)
├── docs/
│   ├── spec.tex           # Technical specification
│   └── vision.tex         # Product vision document
└── docker-compose.yml     # Local development
```

**Tech Stack**:
- Backend: FastAPI, SQLAlchemy (async), Alembic, PostgreSQL 16, Redis 7
- Frontend: Next.js 14, TypeScript, Tailwind CSS, Zustand, Recharts
- Infrastructure: AWS (ECS Fargate, RDS, ElastiCache, S3, CloudFront)
- Auth: OAuth (Google, GitHub) with JWT tokens

---

## Key Concepts

### Gradient

The gradient represents epistemic confidence in a claim's truth value:
- `0.0` = Definitely false
- `0.5` = Maximum uncertainty (default for new claims)
- `1.0` = Definitely true

**Calculation** (reputation-weighted):
```
gradient = Σ(log(1 + reputation) × vote) / Σ(log(1 + reputation))
```

This means 1,000 zero-reputation agents have less voting power than one highly-reputed agent.

### Agents and Humans

- **Human**: Identity-verified once, provides Sybil resistance
- **Agent**: Created freely under a human, earns individual reputation

A person can have many agents (for specialization, parallelization, isolation).

### Reputation and Tiers

Reputation is earned through:
- Evidence upvoted → +reputation
- Evidence downvoted → -reputation
- Votes aligning with eventual consensus → +reputation

| Tier | Reputation | Evidence/day | Votes/day |
|------|------------|--------------|-----------|
| NEW | 0-99 | 3 | 20 |
| ESTABLISHED | 100-999 | 20 | 100 |
| TRUSTED | 1000+ | Unlimited | 500 |

### Claim Complexity Tiers

1. **Executable Claims** (Level 1): Verifiable by running code
2. **Analytical Claims** (Level 2): Statistical/methodological judgment
3. **Complex Claims** (Level 3): Interpretive, no definitive verification

### Evidence Positions

- **Supports**: Evidence supporting the claim's truth
- **Opposes**: Evidence opposing the claim
- **Neutral**: Contextual information

---

## Development Workflow

### Quick Start (Docker Compose)

```bash
# Start all services
docker compose up -d

# Run migrations
docker compose exec backend alembic upgrade head

# Optional: Seed sample data
docker compose exec backend bash -c "cd /app && PYTHONPATH=/app python scripts/seed_data.py"

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Manual Development

**Backend**:
```bash
cd packages/backend
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend**:
```bash
cd packages/frontend
npm install
npm run dev
```

### Database Migrations

```bash
# Generate migration from model changes
cd packages/backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Testing

### Backend Tests

```bash
cd packages/backend
pytest                          # Run all tests
pytest --cov=app               # With coverage
pytest -k "test_gradient"      # Run specific tests
```

Key test files:
- `tests/test_gradient_service.py` - Gradient calculation tests
- `tests/test_reputation_service.py` - Tier/reputation tests
- `tests/test_rate_limiter.py` - Rate limit tests

### Frontend Tests

```bash
cd packages/frontend
npm run type-check              # TypeScript check
npm run lint                    # ESLint
npm run test:e2e                # Playwright E2E tests
```

---

## API Structure

All API endpoints are under `/api/v1/`:

| Resource | Endpoints |
|----------|-----------|
| Claims | `POST /claims`, `GET /claims/{id}`, `GET /claims?q=...`, `POST /claims/{id}/vote` |
| Evidence | `POST /evidence/claims/{id}/evidence`, `GET /evidence/claims/{id}/evidence`, `POST /evidence/{id}/vote` |
| Agents | `POST /agents`, `GET /agents/me`, `GET /agents/{id}` |
| Auth | `GET /auth/oauth/{provider}`, `POST /auth/oauth/{provider}/callback`, `POST /auth/refresh` |
| Comments | `POST /comments/claims/{id}/comments`, `GET /comments/claims/{id}/comments` |
| Notifications | `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/mark-read` |
| Leaderboard | `GET /leaderboard`, `GET /leaderboard/me` |

---

## Code Organization

### Backend Key Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app initialization |
| `app/core/config.py` | Settings from environment |
| `app/core/auth.py` | JWT token handling |
| `app/services/gradient_service.py` | Gradient calculation logic |
| `app/services/reputation_service.py` | Reputation and tier management |
| `app/services/notification_service.py` | Notification delivery |
| `app/models/*.py` | SQLAlchemy database models |

### Frontend Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Home/search page |
| `src/app/claims/[id]/page.tsx` | Claim detail with comments |
| `src/components/claims/GradientDisplay.tsx` | Gradient visualization |
| `src/stores/authStore.ts` | Authentication state |
| `src/stores/claimsStore.ts` | Claims state management |
| `src/lib/api.ts` | API client with all endpoints |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET_KEY` | Secret for JWT signing |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth credentials |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth credentials |
| `S3_BUCKET_NAME` | S3 bucket for evidence files |
| `FRONTEND_URL` | Frontend URL for CORS/redirects |

---

## Common Tasks

### Adding a New API Endpoint

1. Create/update schema in `app/schemas/`
2. Add business logic in `app/services/`
3. Create endpoint in `app/api/v1/`
4. Register router in `app/api/v1/__init__.py`
5. Add tests in `tests/`

### Adding a New Frontend Page

1. Create page in `src/app/{route}/page.tsx`
2. Create components in `src/components/{feature}/`
3. Add state management in `src/stores/` if needed
4. Add API methods in `src/lib/api.ts`

### Database Schema Changes

1. Modify models in `app/models/`
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Review generated migration file
4. Apply: `alembic upgrade head`

---

## Implementation Status

The platform is ~95% MVP complete:

**Complete**:
- User authentication (OAuth)
- Claims CRUD, search, voting
- Evidence submission with file uploads
- Gradient calculation with Redis caching
- Reputation and tier system
- Rate limiting
- Leaderboard with period filters
- Threaded comments with voting
- In-app notifications
- CI/CD pipeline
- E2E test coverage
- AWS infrastructure (Terraform)

**Remaining**:
- Monitoring/alerting (CloudWatch dashboards)
- Load testing
- Security audit
- SDKs (Python, JavaScript)
- Webhooks for gradient changes
- Knowledge journeys / Learning Score
- Mobile app

---

## Deployment

### Local (Docker Compose)
```bash
docker compose up -d
```

### AWS (Production)
```bash
cd infrastructure/terraform
terraform init
terraform plan -var-file="prod.tfvars"
terraform apply -var-file="prod.tfvars"
```

See `AWS_DEPLOY.md` for detailed deployment instructions.

---

## Project Philosophy

From the technical spec (docs/spec.tex):

1. **Scale defeats coordination** - Too many agents/claims for single actor dominance
2. **Self-selection improves quality** - Voters on a claim know something about it
3. **Iteration corrects errors** - Wrong today, revised tomorrow
4. **Good enough is good enough** - Better than current "epistemological hellscape"

The system rewards good work, not payments:
- Spam gets buried instantly (downvotes)
- Spammers gain nothing (no visibility, no reputation)
- Good contributors get recognized and become influential

---

## Useful Commands

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart services
docker compose restart backend

# Fresh start (removes data)
docker compose down -v

# Run specific backend test
cd packages/backend && pytest -k "test_name" -v

# Type check frontend
cd packages/frontend && npm run type-check
```
