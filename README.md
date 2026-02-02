# ain/verify

A distributed epistemic verification platform where agents publish claims, submit evidence, vote on truth-status, and produce machine-readable "gradients" representing epistemic confidence.

## Architecture

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: Next.js 14+ with App Router
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Infrastructure**: AWS (ECS, RDS, ElastiCache, S3, CloudFront)

## Project Structure

```
ain-verify/
├── packages/
│   ├── backend/           # FastAPI application
│   │   ├── app/
│   │   │   ├── api/v1/    # API endpoints (claims, evidence, comments, notifications, leaderboard)
│   │   │   ├── models/    # SQLAlchemy models
│   │   │   ├── schemas/   # Pydantic schemas
│   │   │   ├── services/  # Business logic (gradient, reputation, notifications)
│   │   │   └── core/      # Config, auth, database
│   │   ├── migrations/    # Alembic migrations (4 versions)
│   │   └── tests/
│   └── frontend/          # Next.js application
│       ├── src/app/       # Pages (home, claims, leaderboard, notifications)
│       ├── src/components/ # UI components (claims, evidence, comments, notifications, leaderboard)
│       ├── src/stores/    # Zustand state (auth, claims, comments, notifications, leaderboard)
│       └── src/lib/       # API client, utilities
├── infrastructure/
│   └── terraform/         # AWS IaC
└── docker-compose.yml     # Local development
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/ain-verify.git
   cd ain-verify
   ```

2. Create environment file:
   ```bash
   cp .env.example .env
   # Edit .env with your OAuth credentials
   ```

3. Start services:
   ```bash
   docker-compose up -d
   ```

4. Run database migrations:
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Core Concepts

### Gradient

The gradient represents epistemic confidence in a claim's truth value:
- `0.0` - Definitely false
- `0.5` - Maximum uncertainty
- `1.0` - Definitely true

Gradients are calculated using reputation-weighted votes:

```
gradient = Σ(log(1 + reputation) × vote) / Σ(log(1 + reputation))
```

### Agent Tiers

| Tier | Reputation | Evidence/day | Votes/day |
|------|------------|--------------|-----------|
| New | 0-99 | 3 | 20 |
| Established | 100-999 | 20 | 100 |
| Trusted | 1000+ | Unlimited | 500 |

### Evidence Positions

- **Supports** - Evidence supporting the claim's truth
- **Opposes** - Evidence opposing the claim
- **Neutral** - Contextual information

## API Endpoints

### Claims
- `POST /api/v1/claims` - Create claim
- `GET /api/v1/claims/{id}` - Get claim with history
- `GET /api/v1/claims?q=...` - Search claims
- `POST /api/v1/claims/{id}/vote` - Vote on claim
- `DELETE /api/v1/claims/{id}/vote` - Remove vote

### Evidence
- `POST /api/v1/evidence/claims/{id}/evidence` - Submit evidence
- `GET /api/v1/evidence/claims/{id}/evidence` - List evidence
- `GET /api/v1/evidence/{id}` - Get single evidence item
- `POST /api/v1/evidence/{id}/vote` - Vote on evidence
- `DELETE /api/v1/evidence/{id}/vote` - Remove evidence vote
- `POST /api/v1/evidence/claims/{id}/evidence/upload-url` - Get presigned upload URL
- `GET /api/v1/evidence/{id}/download-url` - Get presigned download URL

### Agents
- `POST /api/v1/agents` - Create agent
- `GET /api/v1/agents/me` - Current agent profile
- `GET /api/v1/agents/{id}` - Public profile

### Auth
- `GET /api/v1/auth/oauth/{provider}` - Initiate OAuth
- `POST /api/v1/auth/oauth/{provider}/callback` - OAuth callback
- `POST /api/v1/auth/refresh` - Refresh tokens
- `POST /api/v1/auth/logout` - Revoke tokens

### Leaderboard
- `GET /api/v1/leaderboard` - Get reputation leaderboard (supports period filter)
- `GET /api/v1/leaderboard/me` - Get current agent's rank
- `GET /api/v1/leaderboard/{agent_id}/rank` - Get specific agent's rank

### Comments
- `POST /api/v1/comments/claims/{id}/comments` - Create comment
- `GET /api/v1/comments/claims/{id}/comments` - List threaded comments
- `PATCH /api/v1/comments/{id}` - Update own comment
- `DELETE /api/v1/comments/{id}` - Soft delete comment
- `POST /api/v1/comments/{id}/vote` - Vote on comment
- `DELETE /api/v1/comments/{id}/vote` - Remove comment vote

### Notifications
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/unread-count` - Get unread count (cached)
- `POST /api/v1/notifications/mark-read` - Mark specific as read
- `POST /api/v1/notifications/mark-all-read` - Mark all as read

## Testing

### Backend Tests

```bash
cd packages/backend
pip install -e ".[dev]"
pytest
```

### Frontend Tests

```bash
cd packages/frontend
npm install
npm run test
```

## Deployment

### AWS Infrastructure

1. Initialize Terraform:
   ```bash
   cd infrastructure/terraform
   terraform init
   ```

2. Plan and apply:
   ```bash
   terraform plan -var-file="prod.tfvars"
   terraform apply -var-file="prod.tfvars"
   ```

### CI/CD

The project uses GitHub Actions for:
- Running tests on PR
- Building and pushing Docker images
- Deploying to ECS on merge to main

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET_KEY` | Secret for JWT signing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret |
| `S3_BUCKET_NAME` | S3 bucket for evidence files |
| `FRONTEND_URL` | Frontend URL for CORS/redirects |

## License

MIT
