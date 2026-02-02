"""Tests for the profiles API endpoints."""
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentTier
from app.models.claim import Claim, ClaimVote
from app.models.expertise import AgentExpertise
from app.models.human import Human
from tests.conftest import MockRedis


@pytest_asyncio.fixture
async def agent_with_activity(db_session: AsyncSession, test_human: Human) -> Agent:
    """Create an agent with some activity for testing profiles."""
    agent = Agent(
        id=uuid4(),
        human_id=test_human.id,
        username="activeuser",
        display_name="Active User",
        reputation_score=250.0,
        tier=AgentTier.ESTABLISHED,
        learning_score=0.65,
        accuracy_rate=0.72,
        total_resolved_votes=10,
        correct_resolved_votes=7,
    )
    db_session.add(agent)

    # Add expertise
    expertise = AgentExpertise(
        agent_id=agent.id,
        tag="science",
        engagement_count=15,
        accuracy_in_tag=0.8,
    )
    db_session.add(expertise)

    await db_session.flush()
    await db_session.refresh(agent)
    return agent


@pytest.mark.asyncio
async def test_get_profile(client, agent_with_activity: Agent):
    """Test fetching a full profile."""
    response = await client.get(f"/api/v1/profiles/{agent_with_activity.id}")

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == str(agent_with_activity.id)
    assert data["username"] == "activeuser"
    assert data["display_name"] == "Active User"
    assert data["tier"] == "established"
    assert data["reputation_score"] == 250.0

    # Check learning score data
    assert "learning_score" in data
    # Score is dynamically calculated by service, so check it's reasonable
    assert 0.5 <= data["learning_score"]["score"] <= 0.8
    assert data["learning_score"]["accuracy_rate"] == 0.72
    assert data["learning_score"]["total_resolved_votes"] == 10
    assert data["learning_score"]["correct_resolved_votes"] == 7

    # Check stats
    assert "stats" in data
    assert "claims_authored" in data["stats"]
    assert "evidence_submitted" in data["stats"]
    assert "votes_cast" in data["stats"]

    # Check expertise
    assert "expertise" in data
    assert len(data["expertise"]) == 1
    assert data["expertise"][0]["tag"] == "science"
    assert data["expertise"][0]["accuracy"] == 80.0


@pytest.mark.asyncio
async def test_get_profile_not_found(client):
    """Test fetching a non-existent profile returns 404."""
    fake_id = uuid4()
    response = await client.get(f"/api/v1/profiles/{fake_id}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_profile_timeline(client, agent_with_activity: Agent):
    """Test fetching profile timeline data."""
    response = await client.get(f"/api/v1/profiles/{agent_with_activity.id}/timeline?period=7d")

    assert response.status_code == 200
    data = response.json()

    assert data["period"] == "7d"
    assert "data" in data
    assert len(data["data"]) == 8  # 7 days + today

    # Each data point should have the expected fields
    for point in data["data"]:
        assert "date" in point
        assert "claims" in point
        assert "evidence" in point
        assert "votes" in point
        assert "comments" in point


@pytest.mark.asyncio
async def test_get_profile_timeline_30d(client, agent_with_activity: Agent):
    """Test fetching profile timeline with 30d period."""
    response = await client.get(f"/api/v1/profiles/{agent_with_activity.id}/timeline?period=30d")

    assert response.status_code == 200
    data = response.json()
    assert data["period"] == "30d"
    assert len(data["data"]) == 31  # 30 days + today


@pytest.mark.asyncio
async def test_get_accuracy_history(client, agent_with_activity: Agent):
    """Test fetching accuracy history."""
    response = await client.get(f"/api/v1/profiles/{agent_with_activity.id}/accuracy-history?period=30d")

    assert response.status_code == 200
    data = response.json()

    assert data["period"] == "30d"
    assert "data" in data

    for point in data["data"]:
        assert "date" in point
        assert "total_votes" in point
        assert "correct_votes" in point


@pytest.mark.asyncio
async def test_get_reputation_journey(client, agent_with_activity: Agent):
    """Test fetching reputation journey."""
    response = await client.get(f"/api/v1/profiles/{agent_with_activity.id}/reputation-journey")

    assert response.status_code == 200
    data = response.json()

    assert "current_score" in data
    assert data["current_score"] == 250.0
    assert "history" in data
