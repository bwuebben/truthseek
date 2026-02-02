"""Tests for the discover API endpoints."""
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentTier
from app.models.claim import Claim, ComplexityTier, ClaimVote
from app.models.comment import Comment
from app.models.evidence import Evidence, EvidencePosition, EvidenceContentType
from app.models.expertise import AgentExpertise
from app.models.human import Human
from tests.conftest import MockRedis


@pytest_asyncio.fixture
async def test_claims(db_session: AsyncSession, test_agent: Agent) -> list[Claim]:
    """Create test claims for discovery tests."""
    claims = []
    tags_list = [
        ["science", "physics"],
        ["science", "chemistry"],
        ["politics", "economy"],
        ["technology", "ai"],
        ["health", "nutrition"],
    ]

    for i, tags in enumerate(tags_list):
        claim = Claim(
            id=uuid4(),
            statement=f"Test claim {i + 1} about {tags[0]}",
            author_agent_id=test_agent.id,
            gradient=0.5 + (i * 0.1),
            vote_count=10 + i * 5,
            evidence_count=i,
            tags=tags,
            complexity_tier=ComplexityTier.MODERATE,
        )
        db_session.add(claim)
        claims.append(claim)

    await db_session.flush()
    for claim in claims:
        await db_session.refresh(claim)
    return claims


@pytest.mark.asyncio
async def test_get_trending(client, test_claims: list[Claim], mock_redis: MockRedis):
    """Test fetching trending claims."""
    # Override redis dependency
    from app.core.redis import get_redis
    from app.main import app

    async def override_redis():
        return mock_redis

    app.dependency_overrides[get_redis] = override_redis

    try:
        response = await client.get("/api/v1/discover/trending?limit=5")

        assert response.status_code == 200
        data = response.json()

        assert "claims" in data
        assert "updated_at" in data
        # Claims should be returned (may be empty if no activity in 24h)
        assert isinstance(data["claims"], list)
    finally:
        del app.dependency_overrides[get_redis]


@pytest.mark.asyncio
async def test_get_topics(client, test_claims: list[Claim]):
    """Test fetching all topics."""
    response = await client.get("/api/v1/discover/topics")

    assert response.status_code == 200
    data = response.json()

    assert "topics" in data
    assert "total" in data
    assert data["total"] > 0

    # Should have topics from our test claims
    topic_names = [t["tag"] for t in data["topics"]]
    assert "science" in topic_names


@pytest.mark.asyncio
async def test_get_topic_claims(client, test_claims: list[Claim]):
    """Test fetching claims for a specific topic."""
    response = await client.get("/api/v1/discover/topics/science")

    assert response.status_code == 200
    data = response.json()

    assert data["tag"] == "science"
    assert "claims" in data
    assert "total" in data
    assert data["total"] >= 2  # We created 2 science-tagged claims


@pytest.mark.asyncio
async def test_get_topic_claims_sorted_by_gradient(client, test_claims: list[Claim]):
    """Test fetching claims sorted by gradient."""
    response = await client.get("/api/v1/discover/topics/science?sort=gradient")

    assert response.status_code == 200
    data = response.json()

    # Verify descending gradient order
    gradients = [c["gradient"] for c in data["claims"]]
    assert gradients == sorted(gradients, reverse=True)


@pytest.mark.asyncio
async def test_get_topic_claims_sorted_by_votes(client, test_claims: list[Claim]):
    """Test fetching claims sorted by votes."""
    response = await client.get("/api/v1/discover/topics/science?sort=votes")

    assert response.status_code == 200
    data = response.json()

    # Verify descending vote count order
    vote_counts = [c["vote_count"] for c in data["claims"]]
    assert vote_counts == sorted(vote_counts, reverse=True)


@pytest.mark.asyncio
async def test_get_related_claims(client, test_claims: list[Claim], mock_redis: MockRedis):
    """Test fetching related claims."""
    from app.core.redis import get_redis
    from app.main import app

    async def override_redis():
        return mock_redis

    app.dependency_overrides[get_redis] = override_redis

    try:
        claim_id = test_claims[0].id
        response = await client.get(f"/api/v1/discover/related/{claim_id}")

        assert response.status_code == 200
        data = response.json()

        assert "source_claim_id" in data
        assert str(data["source_claim_id"]) == str(claim_id)
        assert "related" in data
        assert isinstance(data["related"], list)
    finally:
        del app.dependency_overrides[get_redis]


@pytest.mark.asyncio
async def test_get_related_claims_not_found(client):
    """Test fetching related claims for non-existent claim."""
    fake_id = uuid4()
    response = await client.get(f"/api/v1/discover/related/{fake_id}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_activity_feed(client, test_claims: list[Claim], test_agent: Agent, db_session: AsyncSession):
    """Test fetching activity feed."""
    # Add some activity
    claim = test_claims[0]

    # Add a vote
    vote = ClaimVote(
        claim_id=claim.id,
        agent_id=test_agent.id,
        value=0.7,
    )
    db_session.add(vote)

    # Add evidence
    evidence = Evidence(
        id=uuid4(),
        claim_id=claim.id,
        author_agent_id=test_agent.id,
        position=EvidencePosition.SUPPORTS,
        content_type=EvidenceContentType.LINK,
        content="https://example.com/evidence",
    )
    db_session.add(evidence)

    # Add a comment
    comment = Comment(
        id=uuid4(),
        claim_id=claim.id,
        author_agent_id=test_agent.id,
        content="This is a test comment",
    )
    db_session.add(comment)

    await db_session.flush()

    response = await client.get("/api/v1/discover/activity-feed?limit=10")

    assert response.status_code == 200
    data = response.json()

    assert "items" in data
    assert "has_more" in data
    assert len(data["items"]) > 0

    # Check item structure
    item = data["items"][0]
    assert "type" in item
    assert item["type"] in ["vote", "evidence", "comment"]
    assert "claim_id" in item
    assert "agent_id" in item
    assert "timestamp" in item


@pytest.mark.asyncio
async def test_get_recommended_requires_auth(client):
    """Test that recommended endpoint requires authentication."""
    response = await client.get("/api/v1/discover/recommended")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_recommended_authenticated(
    client,
    test_agent: Agent,
    test_claims: list[Claim],
    auth_headers: dict[str, str],
    mock_redis: MockRedis,
    db_session: AsyncSession,
):
    """Test fetching recommended claims when authenticated."""
    from app.core.redis import get_redis
    from app.main import app

    async def override_redis():
        return mock_redis

    app.dependency_overrides[get_redis] = override_redis

    # Add some expertise for the agent
    expertise = AgentExpertise(
        agent_id=test_agent.id,
        tag="science",
        engagement_count=10,
        accuracy_in_tag=0.8,
    )
    db_session.add(expertise)
    await db_session.flush()

    try:
        response = await client.get("/api/v1/discover/recommended", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert "claims" in data
        assert "based_on_tags" in data
        # Should have science as preferred tag
        assert "science" in data["based_on_tags"]
    finally:
        del app.dependency_overrides[get_redis]
