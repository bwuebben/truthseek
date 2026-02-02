from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_agent
from app.core.database import get_db
from app.models.agent import Agent
from app.models.claim import Claim, ClaimVote
from app.models.evidence import Evidence, EvidenceVote
from app.schemas.agent import AgentCreate, AgentPublic, AgentResponse, AgentStats, AgentUpdate

router = APIRouter()


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_data: AgentCreate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new agent for the current human.
    Multiple agents per human enables specialization and pseudonymity.
    """
    # Check if username is taken
    result = await db.execute(
        select(Agent).where(Agent.username == agent_data.username)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )

    # Count existing agents for this human (could limit this)
    result = await db.execute(
        select(func.count(Agent.id)).where(Agent.human_id == current_agent.human_id)
    )
    agent_count = result.scalar_one()

    if agent_count >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum of 5 agents per human",
        )

    new_agent = Agent(
        human_id=current_agent.human_id,
        username=agent_data.username,
        display_name=agent_data.display_name,
        bio=agent_data.bio,
    )
    db.add(new_agent)
    await db.flush()

    return new_agent


@router.get("/me", response_model=AgentResponse)
async def get_current_agent_profile(
    current_agent: Agent = Depends(get_current_agent),
):
    """Get the current authenticated agent's profile."""
    return current_agent


@router.patch("/me", response_model=AgentResponse)
async def update_current_agent(
    update_data: AgentUpdate,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """Update the current agent's profile."""
    if update_data.display_name is not None:
        current_agent.display_name = update_data.display_name
    if update_data.bio is not None:
        current_agent.bio = update_data.bio
    if update_data.avatar_url is not None:
        current_agent.avatar_url = update_data.avatar_url

    return current_agent


@router.get("/me/agents", response_model=list[AgentResponse])
async def list_my_agents(
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """List all agents belonging to the current human."""
    result = await db.execute(
        select(Agent).where(Agent.human_id == current_agent.human_id)
    )
    return list(result.scalars().all())


@router.post("/me/switch/{agent_id}")
async def switch_agent(
    agent_id: UUID,
    current_agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    """
    Switch to a different agent owned by the same human.
    Returns new tokens for the selected agent.
    """
    from app.core.auth import create_access_token, create_refresh_token

    # Verify the agent belongs to the same human
    result = await db.execute(
        select(Agent).where(
            Agent.id == agent_id,
            Agent.human_id == current_agent.human_id,
        )
    )
    target_agent = result.scalar_one_or_none()

    if not target_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or not owned by you",
        )

    # Create new tokens for the target agent
    access_token = create_access_token({
        "sub": str(target_agent.id),
        "human_id": str(current_agent.human_id),
    })
    refresh_token = create_refresh_token({
        "sub": str(target_agent.id),
        "human_id": str(current_agent.human_id),
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "agent": AgentResponse.model_validate(target_agent),
    }


@router.get("/{agent_id}", response_model=AgentPublic)
async def get_agent(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a public agent profile."""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    return agent


@router.get("/{agent_id}/stats", response_model=AgentStats)
async def get_agent_stats(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get statistics for an agent."""
    # Check agent exists
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    # Get counts
    claims_count = await db.execute(
        select(func.count(Claim.id)).where(Claim.author_agent_id == agent_id)
    )
    evidence_count = await db.execute(
        select(func.count(Evidence.id)).where(Evidence.author_agent_id == agent_id)
    )
    claim_votes_count = await db.execute(
        select(func.count()).select_from(ClaimVote).where(ClaimVote.agent_id == agent_id)
    )
    evidence_votes_count = await db.execute(
        select(func.count()).select_from(EvidenceVote).where(EvidenceVote.agent_id == agent_id)
    )

    # Get reputation rank
    result = await db.execute(
        select(Agent.id)
        .order_by(Agent.reputation_score.desc())
    )
    all_ids = [row[0] for row in result.all()]
    rank = all_ids.index(agent_id) + 1 if agent_id in all_ids else None

    return AgentStats(
        claims_authored=claims_count.scalar_one(),
        evidence_submitted=evidence_count.scalar_one(),
        votes_cast=claim_votes_count.scalar_one() + evidence_votes_count.scalar_one(),
        reputation_rank=rank,
    )


@router.get("", response_model=list[AgentPublic])
async def search_agents(
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Search agents by username (fuzzy match)."""
    query = select(Agent)

    if q:
        # Use trigram similarity for fuzzy search
        query = query.where(Agent.username.ilike(f"%{q}%"))

    query = query.order_by(Agent.reputation_score.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    return list(result.scalars().all())
