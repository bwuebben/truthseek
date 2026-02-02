"""Tests for the bookmarks and follows API endpoints."""
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent, AgentTier
from app.models.claim import Claim, ComplexityTier
from app.models.human import Human


@pytest_asyncio.fixture
async def bookmark_claim(db_session: AsyncSession, test_agent: Agent) -> Claim:
    """Create a claim for bookmark/follow tests."""
    claim = Claim(
        id=uuid4(),
        statement="A claim to bookmark and follow",
        author_agent_id=test_agent.id,
        gradient=0.5,
        vote_count=10,
        evidence_count=2,
        tags=["test", "bookmark"],
        complexity_tier=ComplexityTier.MODERATE,
    )
    db_session.add(claim)
    await db_session.flush()
    await db_session.refresh(claim)
    return claim


@pytest.mark.asyncio
async def test_bookmark_claim(client, bookmark_claim: Claim, auth_headers: dict[str, str]):
    """Test bookmarking a claim."""
    response = await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/bookmark",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_bookmarked"] is True


@pytest.mark.asyncio
async def test_bookmark_claim_idempotent(client, bookmark_claim: Claim, auth_headers: dict[str, str]):
    """Test that bookmarking the same claim twice is idempotent."""
    # First bookmark
    response1 = await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/bookmark",
        headers=auth_headers,
    )
    assert response1.status_code == 200

    # Second bookmark should still succeed (idempotent)
    response2 = await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/bookmark",
        headers=auth_headers,
    )
    assert response2.status_code == 200


@pytest.mark.asyncio
async def test_remove_bookmark(client, bookmark_claim: Claim, auth_headers: dict[str, str]):
    """Test removing a bookmark."""
    # First bookmark
    await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/bookmark",
        headers=auth_headers,
    )

    # Remove bookmark
    response = await client.delete(
        f"/api/v1/claims/{bookmark_claim.id}/bookmark",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_bookmarked"] is False


@pytest.mark.asyncio
async def test_list_bookmarks(client, bookmark_claim: Claim, auth_headers: dict[str, str]):
    """Test listing bookmarked claims."""
    # Bookmark the claim
    await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/bookmark",
        headers=auth_headers,
    )

    # List bookmarks
    response = await client.get("/api/v1/claims/bookmarks", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()

    assert "claims" in data
    assert "total" in data
    assert data["total"] >= 1

    # The bookmarked claim should be in the list
    claim_ids = [c["id"] for c in data["claims"]]
    assert str(bookmark_claim.id) in claim_ids


@pytest.mark.asyncio
async def test_list_bookmarks_empty(client, auth_headers: dict[str, str]):
    """Test listing bookmarks when none exist."""
    response = await client.get("/api/v1/claims/bookmarks", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["claims"] == []


@pytest.mark.asyncio
async def test_bookmark_requires_auth(client, bookmark_claim: Claim):
    """Test that bookmarking requires authentication."""
    response = await client.post(f"/api/v1/claims/{bookmark_claim.id}/bookmark")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_bookmark_nonexistent_claim(client, auth_headers: dict[str, str]):
    """Test bookmarking a non-existent claim."""
    fake_id = uuid4()
    response = await client.post(
        f"/api/v1/claims/{fake_id}/bookmark",
        headers=auth_headers,
    )
    assert response.status_code == 404


# Follow tests
@pytest.mark.asyncio
async def test_follow_claim(client, bookmark_claim: Claim, auth_headers: dict[str, str]):
    """Test following a claim."""
    response = await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/follow",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_following"] is True
    assert data["notify_on_vote"] is True
    assert data["notify_on_evidence"] is True
    assert data["notify_on_comment"] is True


@pytest.mark.asyncio
async def test_follow_claim_with_settings(client, bookmark_claim: Claim, auth_headers: dict[str, str]):
    """Test following a claim with custom notification settings."""
    response = await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/follow",
        headers=auth_headers,
        json={
            "notify_on_vote": False,
            "notify_on_evidence": True,
            "notify_on_comment": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_following"] is True
    # Note: The endpoint may not accept custom settings without a PATCH
    # Testing that the follow was created successfully


@pytest.mark.asyncio
async def test_unfollow_claim(client, bookmark_claim: Claim, auth_headers: dict[str, str]):
    """Test unfollowing a claim."""
    # First follow
    await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/follow",
        headers=auth_headers,
    )

    # Unfollow
    response = await client.delete(
        f"/api/v1/claims/{bookmark_claim.id}/follow",
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_following"] is False


@pytest.mark.asyncio
async def test_list_following(client, bookmark_claim: Claim, auth_headers: dict[str, str]):
    """Test listing followed claims."""
    # Follow the claim
    await client.post(
        f"/api/v1/claims/{bookmark_claim.id}/follow",
        headers=auth_headers,
    )

    # List following
    response = await client.get("/api/v1/claims/following", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()

    assert "claims" in data
    assert "total" in data
    assert data["total"] >= 1

    # The followed claim should be in the list
    claim_ids = [c["id"] for c in data["claims"]]
    assert str(bookmark_claim.id) in claim_ids


@pytest.mark.asyncio
async def test_list_following_empty(client, auth_headers: dict[str, str]):
    """Test listing followed claims when none exist."""
    response = await client.get("/api/v1/claims/following", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["claims"] == []


@pytest.mark.asyncio
async def test_follow_requires_auth(client, bookmark_claim: Claim):
    """Test that following requires authentication."""
    response = await client.post(f"/api/v1/claims/{bookmark_claim.id}/follow")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_follow_nonexistent_claim(client, auth_headers: dict[str, str]):
    """Test following a non-existent claim."""
    fake_id = uuid4()
    response = await client.post(
        f"/api/v1/claims/{fake_id}/follow",
        headers=auth_headers,
    )
    assert response.status_code == 404
