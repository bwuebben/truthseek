import pytest
from uuid import uuid4

from app.models.agent import Agent, AgentTier
from app.models.human import Human
from app.models.rate_limit import ActionType
from app.services.rate_limiter_service import RateLimiterService, RateLimitExceeded


@pytest.mark.asyncio
async def test_check_rate_limit_allowed(db_session, mock_redis):
    """Test rate limit check when under limit."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        tier=AgentTier.NEW,
    )
    db_session.add(agent)
    await db_session.commit()

    service = RateLimiterService(db_session, mock_redis)
    allowed, current, limit = await service.check_rate_limit(agent, ActionType.CLAIM_VOTE)

    assert allowed is True
    assert current == 0
    assert limit == 20  # NEW tier vote limit


@pytest.mark.asyncio
async def test_increment_counter(db_session, mock_redis):
    """Test incrementing rate limit counter."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        tier=AgentTier.NEW,
    )
    db_session.add(agent)
    await db_session.commit()

    service = RateLimiterService(db_session, mock_redis)

    # First increment
    count = await service.increment(agent, ActionType.CLAIM_VOTE, check_first=False)
    assert count == 1

    # Second increment
    count = await service.increment(agent, ActionType.CLAIM_VOTE, check_first=False)
    assert count == 2

    # Check the limit
    allowed, current, limit = await service.check_rate_limit(agent, ActionType.CLAIM_VOTE)
    assert current == 2


@pytest.mark.asyncio
async def test_rate_limit_exceeded(db_session, mock_redis):
    """Test that exceeding rate limit raises exception."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        tier=AgentTier.NEW,
    )
    db_session.add(agent)
    await db_session.commit()

    service = RateLimiterService(db_session, mock_redis)

    # Use up all votes (NEW tier has 20 votes/day)
    for _ in range(20):
        await service.increment(agent, ActionType.CLAIM_VOTE, check_first=False)

    # Next attempt should fail
    with pytest.raises(RateLimitExceeded) as exc_info:
        await service.increment(agent, ActionType.CLAIM_VOTE, check_first=True)

    assert exc_info.value.current == 20
    assert exc_info.value.limit == 20


@pytest.mark.asyncio
async def test_different_tier_limits(db_session, mock_redis):
    """Test that different tiers have different limits."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    new_agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="newuser",
        tier=AgentTier.NEW,
    )
    trusted_agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="trusteduser",
        tier=AgentTier.TRUSTED,
    )
    db_session.add_all([new_agent, trusted_agent])
    await db_session.commit()

    service = RateLimiterService(db_session, mock_redis)

    # Check NEW tier limits
    new_limit = await service.get_limit_for_action(new_agent, ActionType.EVIDENCE_SUBMIT)
    assert new_limit == 3  # NEW tier evidence limit

    # Check TRUSTED tier limits
    trusted_limit = await service.get_limit_for_action(trusted_agent, ActionType.EVIDENCE_SUBMIT)
    assert trusted_limit == 10000  # Effectively unlimited


@pytest.mark.asyncio
async def test_get_remaining(db_session, mock_redis):
    """Test getting remaining actions."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        tier=AgentTier.NEW,
    )
    db_session.add(agent)
    await db_session.commit()

    service = RateLimiterService(db_session, mock_redis)

    # Start with full limit
    remaining = await service.get_remaining(agent, ActionType.CLAIM_VOTE)
    assert remaining == 20

    # Use some
    for _ in range(5):
        await service.increment(agent, ActionType.CLAIM_VOTE, check_first=False)

    remaining = await service.get_remaining(agent, ActionType.CLAIM_VOTE)
    assert remaining == 15


@pytest.mark.asyncio
async def test_get_all_limits(db_session, mock_redis):
    """Test getting all rate limit statuses."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        tier=AgentTier.ESTABLISHED,
    )
    db_session.add(agent)
    await db_session.commit()

    service = RateLimiterService(db_session, mock_redis)

    # Use some actions
    await service.increment(agent, ActionType.CLAIM_VOTE, check_first=False)
    await service.increment(agent, ActionType.EVIDENCE_SUBMIT, check_first=False)

    limits = await service.get_all_limits(agent)

    assert "claim_vote" in limits
    assert limits["claim_vote"]["current"] == 1
    assert limits["claim_vote"]["limit"] == 100  # ESTABLISHED tier

    assert "evidence_submit" in limits
    assert limits["evidence_submit"]["current"] == 1
    assert limits["evidence_submit"]["limit"] == 20  # ESTABLISHED tier
