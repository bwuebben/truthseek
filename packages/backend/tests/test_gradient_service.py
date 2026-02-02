import pytest
from uuid import uuid4

from app.models.agent import Agent, AgentTier
from app.models.claim import Claim, ClaimVote
from app.models.human import Human
from app.services.gradient_service import GradientService


@pytest.mark.asyncio
async def test_compute_gradient_no_votes(db_session, mock_redis):
    """Test gradient returns 0.5 when there are no votes."""
    # Create claim
    human = Human(id=uuid4(), email="author@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(id=uuid4(), human_id=human.id, username="author")
    db_session.add(agent)
    await db_session.flush()

    claim = Claim(id=uuid4(), statement="Test claim", author_agent_id=agent.id)
    db_session.add(claim)
    await db_session.commit()

    gradient_service = GradientService(db_session, mock_redis)
    gradient = await gradient_service.compute_gradient(claim.id)

    assert gradient == 0.5


@pytest.mark.asyncio
async def test_compute_gradient_single_vote(db_session, mock_redis):
    """Test gradient with a single vote."""
    # Create entities
    human = Human(id=uuid4(), email="author@test.com")
    db_session.add(human)
    await db_session.flush()

    author = Agent(id=uuid4(), human_id=human.id, username="author", reputation_score=0)
    voter = Agent(id=uuid4(), human_id=human.id, username="voter", reputation_score=100)
    db_session.add_all([author, voter])
    await db_session.flush()

    claim = Claim(id=uuid4(), statement="Test claim", author_agent_id=author.id)
    db_session.add(claim)
    await db_session.flush()

    vote = ClaimVote(claim_id=claim.id, agent_id=voter.id, value=1.0)
    db_session.add(vote)
    await db_session.commit()

    gradient_service = GradientService(db_session, mock_redis)
    gradient = await gradient_service.compute_gradient(claim.id)

    # With only one vote of 1.0, gradient should be 1.0
    assert gradient == 1.0


@pytest.mark.asyncio
async def test_compute_gradient_weighted_votes(db_session, mock_redis):
    """Test gradient properly weights votes by reputation."""
    # Create entities
    human = Human(id=uuid4(), email="author@test.com")
    db_session.add(human)
    await db_session.flush()

    author = Agent(id=uuid4(), human_id=human.id, username="author", reputation_score=0)
    low_rep_voter = Agent(id=uuid4(), human_id=human.id, username="low_rep", reputation_score=10)
    high_rep_voter = Agent(
        id=uuid4(), human_id=human.id, username="high_rep", reputation_score=1000
    )
    db_session.add_all([author, low_rep_voter, high_rep_voter])
    await db_session.flush()

    claim = Claim(id=uuid4(), statement="Test claim", author_agent_id=author.id)
    db_session.add(claim)
    await db_session.flush()

    # Low rep votes false, high rep votes true
    vote1 = ClaimVote(claim_id=claim.id, agent_id=low_rep_voter.id, value=0.0)
    vote2 = ClaimVote(claim_id=claim.id, agent_id=high_rep_voter.id, value=1.0)
    db_session.add_all([vote1, vote2])
    await db_session.commit()

    gradient_service = GradientService(db_session, mock_redis)
    gradient = await gradient_service.compute_gradient(claim.id)

    # Gradient should be closer to 1.0 due to higher weight of high_rep_voter
    assert gradient > 0.7


@pytest.mark.asyncio
async def test_gradient_caching(db_session, mock_redis):
    """Test that gradients are properly cached."""
    # Create claim
    human = Human(id=uuid4(), email="author@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(id=uuid4(), human_id=human.id, username="author")
    db_session.add(agent)
    await db_session.flush()

    claim = Claim(id=uuid4(), statement="Test claim", author_agent_id=agent.id)
    db_session.add(claim)
    await db_session.commit()

    gradient_service = GradientService(db_session, mock_redis)

    # First call computes gradient
    gradient1 = await gradient_service.get_gradient(claim.id)

    # Check it was cached
    cache_key = f"gradient:{claim.id}"
    cached_value = await mock_redis.get(cache_key)
    assert cached_value is not None
    assert float(cached_value) == gradient1

    # Second call should use cache
    gradient2 = await gradient_service.get_gradient(claim.id)
    assert gradient1 == gradient2


@pytest.mark.asyncio
async def test_invalidate_cache(db_session, mock_redis):
    """Test cache invalidation."""
    human = Human(id=uuid4(), email="author@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(id=uuid4(), human_id=human.id, username="author")
    db_session.add(agent)
    await db_session.flush()

    claim = Claim(id=uuid4(), statement="Test claim", author_agent_id=agent.id)
    db_session.add(claim)
    await db_session.commit()

    gradient_service = GradientService(db_session, mock_redis)

    # Cache gradient
    await gradient_service.get_gradient(claim.id)
    cache_key = f"gradient:{claim.id}"
    assert await mock_redis.get(cache_key) is not None

    # Invalidate
    await gradient_service.invalidate_cache(claim.id)
    assert await mock_redis.get(cache_key) is None
