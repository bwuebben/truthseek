"""Tests for the stats API endpoints."""
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentTier
from app.models.claim import Claim, ComplexityTier
from app.models.human import Human
from tests.conftest import MockRedis


@pytest_asyncio.fixture
async def stats_test_data(db_session: AsyncSession, test_agent: Agent) -> dict:
    """Create test data for stats tests."""
    # Create additional agents
    agents = [test_agent]
    for i in range(4):
        human = Human(
            id=uuid4(),
            email=f"stats_user{i}@example.com",
            google_id=f"stats_google_{i}",
        )
        db_session.add(human)
        await db_session.flush()

        agent = Agent(
            id=uuid4(),
            human_id=human.id,
            username=f"statsuser{i}",
            display_name=f"Stats User {i}",
            reputation_score=100.0 + i * 10,
            tier=AgentTier.NEW,
        )
        db_session.add(agent)
        agents.append(agent)

    await db_session.flush()

    # Create claims
    claims = []
    for i, agent in enumerate(agents):
        claim = Claim(
            id=uuid4(),
            statement=f"Claim from agent {i}",
            author_agent_id=agent.id,
            gradient=0.5 if i < 3 else (0.9 if i == 3 else 0.1),  # Some at consensus
            vote_count=5,
            evidence_count=0,
            tags=["test"],
            complexity_tier=ComplexityTier.SIMPLE,
        )
        db_session.add(claim)
        claims.append(claim)

    await db_session.flush()

    return {
        "agents": agents,
        "claims": claims,
    }


@pytest.mark.asyncio
async def test_get_platform_stats(client, stats_test_data: dict, mock_redis: MockRedis):
    """Test fetching platform statistics."""
    from app.core.redis import get_redis
    from app.main import app

    async def override_redis():
        return mock_redis

    app.dependency_overrides[get_redis] = override_redis

    try:
        response = await client.get("/api/v1/stats/platform")

        assert response.status_code == 200
        data = response.json()

        assert "total_claims" in data
        assert "total_agents" in data
        assert "total_votes" in data
        assert "claims_at_consensus" in data
        assert "active_agents_7d" in data
        assert "updated_at" in data

        # Verify counts
        assert data["total_claims"] >= 5  # We created 5 claims
        assert data["total_agents"] >= 5  # We created 5 agents
        assert data["claims_at_consensus"] >= 2  # We created 2 claims at consensus
    finally:
        del app.dependency_overrides[get_redis]


@pytest.mark.asyncio
async def test_platform_stats_caching(client, stats_test_data: dict, mock_redis: MockRedis):
    """Test that platform stats are cached."""
    from app.core.redis import get_redis
    from app.main import app

    async def override_redis():
        return mock_redis

    app.dependency_overrides[get_redis] = override_redis

    try:
        # First request - should populate cache
        response1 = await client.get("/api/v1/stats/platform")
        assert response1.status_code == 200
        data1 = response1.json()

        # Second request - should return cached data
        response2 = await client.get("/api/v1/stats/platform")
        assert response2.status_code == 200
        data2 = response2.json()

        # Cached_at should be the same
        assert data1["updated_at"] == data2["updated_at"]
    finally:
        del app.dependency_overrides[get_redis]
