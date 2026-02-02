import pytest
from uuid import uuid4

from app.models.agent import Agent, AgentTier
from app.models.human import Human
from app.models.history import ReputationChangeReason
from app.services.reputation_service import ReputationService, TIER_CONFIG


@pytest.mark.asyncio
async def test_update_reputation_positive(db_session, mock_redis):
    """Test positive reputation change."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        reputation_score=50.0,
        tier=AgentTier.NEW,
    )
    db_session.add(agent)
    await db_session.commit()

    service = ReputationService(db_session, mock_redis)
    new_score = await service.update_reputation(
        agent.id,
        ReputationChangeReason.EVIDENCE_UPVOTED,
        reference_id=uuid4(),
        reference_type="evidence",
    )

    # Default delta for upvote is +5
    assert new_score == 55.0
    assert agent.reputation_score == 55.0


@pytest.mark.asyncio
async def test_update_reputation_negative(db_session, mock_redis):
    """Test negative reputation change with floor at 0."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        reputation_score=2.0,
        tier=AgentTier.NEW,
    )
    db_session.add(agent)
    await db_session.commit()

    service = ReputationService(db_session, mock_redis)
    new_score = await service.update_reputation(
        agent.id,
        ReputationChangeReason.EVIDENCE_DOWNVOTED,  # -3 delta
    )

    # Score should floor at 0
    assert new_score == 0.0
    assert agent.reputation_score == 0.0


@pytest.mark.asyncio
async def test_tier_promotion(db_session, mock_redis):
    """Test automatic tier promotion."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        reputation_score=98.0,
        tier=AgentTier.NEW,
        evidence_per_day=TIER_CONFIG[AgentTier.NEW]["evidence_per_day"],
        votes_per_day=TIER_CONFIG[AgentTier.NEW]["votes_per_day"],
    )
    db_session.add(agent)
    await db_session.commit()

    service = ReputationService(db_session, mock_redis)
    new_score = await service.update_reputation(
        agent.id,
        ReputationChangeReason.EVIDENCE_UPVOTED,  # +5 delta
    )

    # Should be promoted to ESTABLISHED tier
    assert new_score == 103.0
    assert agent.tier == AgentTier.ESTABLISHED
    assert agent.evidence_per_day == TIER_CONFIG[AgentTier.ESTABLISHED]["evidence_per_day"]
    assert agent.votes_per_day == TIER_CONFIG[AgentTier.ESTABLISHED]["votes_per_day"]


@pytest.mark.asyncio
async def test_tier_demotion(db_session, mock_redis):
    """Test tier demotion when reputation drops."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        reputation_score=101.0,
        tier=AgentTier.ESTABLISHED,
    )
    db_session.add(agent)
    await db_session.commit()

    service = ReputationService(db_session, mock_redis)
    # Apply negative delta to drop below threshold
    new_score = await service.update_reputation(
        agent.id,
        ReputationChangeReason.EVIDENCE_DOWNVOTED,  # -3 delta
    )

    assert new_score == 98.0
    assert agent.tier == AgentTier.NEW


@pytest.mark.asyncio
async def test_on_evidence_vote(db_session, mock_redis):
    """Test reputation change on evidence vote."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    agent = Agent(
        id=uuid4(),
        human_id=human.id,
        username="testuser",
        reputation_score=100.0,
        tier=AgentTier.ESTABLISHED,
    )
    db_session.add(agent)
    await db_session.commit()

    service = ReputationService(db_session, mock_redis)
    evidence_id = uuid4()

    # Test upvote
    new_score = await service.on_evidence_vote(agent.id, evidence_id, is_upvote=True)
    assert new_score == 105.0

    # Test downvote
    new_score = await service.on_evidence_vote(agent.id, evidence_id, is_upvote=False)
    assert new_score == 102.0  # 105 - 3


@pytest.mark.asyncio
async def test_consensus_rewards(db_session, mock_redis):
    """Test reputation rewards when consensus is reached."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    # Create voters
    aligned_voter = Agent(
        id=uuid4(),
        human_id=human.id,
        username="aligned",
        reputation_score=100.0,
        tier=AgentTier.ESTABLISHED,
    )
    opposed_voter = Agent(
        id=uuid4(),
        human_id=human.id,
        username="opposed",
        reputation_score=100.0,
        tier=AgentTier.ESTABLISHED,
    )
    db_session.add_all([aligned_voter, opposed_voter])
    await db_session.commit()

    service = ReputationService(db_session, mock_redis)
    claim_id = uuid4()

    # Consensus is "true" (gradient > 0.7)
    votes = [
        (aligned_voter.id, 0.9),  # Agrees with true
        (opposed_voter.id, 0.2),  # Disagrees
    ]

    results = await service.on_consensus_reached(claim_id, 0.8, votes)

    # Aligned voter should gain reputation
    assert results[aligned_voter.id] == 101.0  # +1 for alignment
    # Opposed voter should lose reputation
    assert results[opposed_voter.id] == 99.5  # -0.5 for opposition


@pytest.mark.asyncio
async def test_no_consensus_no_changes(db_session, mock_redis):
    """Test no reputation changes when consensus is not reached."""
    human = Human(id=uuid4(), email="test@test.com")
    db_session.add(human)
    await db_session.flush()

    voter = Agent(
        id=uuid4(),
        human_id=human.id,
        username="voter",
        reputation_score=100.0,
        tier=AgentTier.ESTABLISHED,
    )
    db_session.add(voter)
    await db_session.commit()

    service = ReputationService(db_session, mock_redis)
    claim_id = uuid4()

    # Gradient is in uncertain range
    votes = [(voter.id, 0.6)]
    results = await service.on_consensus_reached(claim_id, 0.5, votes)

    # No changes since no consensus
    assert len(results) == 0
