import os
from collections.abc import AsyncGenerator
from typing import Any
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app
from app.models.agent import Agent, AgentTier
from app.models.human import Human

# Test database URL - use PostgreSQL (models use PostgreSQL-specific features like ARRAY, TSVECTOR)
# Default to a test database on localhost, can be overridden with TEST_DATABASE_URL env var
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://verify:verify@localhost:5432/verify_test"
)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session with cleanup."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Clean up tables before each test (order matters due to foreign keys)
        await session.execute(text("TRUNCATE TABLE notifications CASCADE"))
        await session.execute(text("TRUNCATE TABLE comment_votes CASCADE"))
        await session.execute(text("TRUNCATE TABLE comments CASCADE"))
        await session.execute(text("TRUNCATE TABLE evidence_votes CASCADE"))
        await session.execute(text("TRUNCATE TABLE evidence CASCADE"))
        await session.execute(text("TRUNCATE TABLE claim_votes CASCADE"))
        await session.execute(text("TRUNCATE TABLE claim_parents CASCADE"))
        await session.execute(text("TRUNCATE TABLE gradient_history CASCADE"))
        await session.execute(text("TRUNCATE TABLE agent_claim_follows CASCADE"))
        await session.execute(text("TRUNCATE TABLE agent_claim_bookmarks CASCADE"))
        await session.execute(text("TRUNCATE TABLE claims CASCADE"))
        await session.execute(text("TRUNCATE TABLE rate_limit_counters CASCADE"))
        await session.execute(text("TRUNCATE TABLE reputation_history CASCADE"))
        await session.execute(text("TRUNCATE TABLE agent_expertise CASCADE"))
        await session.execute(text("TRUNCATE TABLE agents CASCADE"))
        await session.execute(text("TRUNCATE TABLE humans CASCADE"))
        await session.commit()

        yield session
        # Rollback any uncommitted changes
        await session.rollback()

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_human(db_session: AsyncSession) -> Human:
    """Create a test human."""
    human = Human(
        id=uuid4(),
        email="test@example.com",
        google_id="test_google_id",
    )
    db_session.add(human)
    await db_session.flush()
    await db_session.refresh(human)
    return human


@pytest_asyncio.fixture
async def test_agent(db_session: AsyncSession, test_human: Human) -> Agent:
    """Create a test agent."""
    agent = Agent(
        id=uuid4(),
        human_id=test_human.id,
        username="testuser",
        display_name="Test User",
        reputation_score=100.0,
        tier=AgentTier.ESTABLISHED,
    )
    db_session.add(agent)
    await db_session.flush()
    await db_session.refresh(agent)
    return agent


@pytest_asyncio.fixture
async def auth_headers(test_agent: Agent) -> dict[str, str]:
    """Create authentication headers for a test agent."""
    from app.core.auth import create_access_token

    token = create_access_token({"sub": str(test_agent.id), "human_id": str(test_agent.human_id)})
    return {"Authorization": f"Bearer {token}"}


class MockRedis:
    """Mock Redis client for testing."""

    def __init__(self):
        self._data: dict[str, Any] = {}

    async def get(self, key: str) -> str | None:
        return self._data.get(key)

    async def set(self, key: str, value: str, ex: int | None = None) -> None:
        self._data[key] = value

    async def setex(self, key: str, ttl: int, value: str) -> None:
        self._data[key] = value

    async def delete(self, *keys: str) -> int:
        deleted = 0
        for key in keys:
            if key in self._data:
                del self._data[key]
                deleted += 1
        return deleted

    async def incr(self, key: str) -> int:
        current = int(self._data.get(key, 0))
        self._data[key] = str(current + 1)
        return current + 1

    async def expire(self, key: str, ttl: int) -> None:
        pass

    async def mget(self, keys: list[str]) -> list[str | None]:
        return [self._data.get(key) for key in keys]

    async def scan(self, cursor: int, match: str = "*", count: int = 100) -> tuple[int, list[str]]:
        """Mock scan for pattern matching keys."""
        import fnmatch
        pattern = match.replace("*", "**")
        matching_keys = [k for k in self._data.keys() if fnmatch.fnmatch(k, pattern)]
        return (0, matching_keys)  # Return cursor=0 to indicate end of scan

    def pipeline(self):
        return MockPipeline(self)

    async def aclose(self):
        pass


class MockPipeline:
    """Mock Redis pipeline."""

    def __init__(self, redis: MockRedis):
        self._redis = redis
        self._commands: list[tuple] = []

    def setex(self, key: str, ttl: int, value: str):
        self._commands.append(("setex", key, ttl, value))
        return self

    async def execute(self):
        for cmd in self._commands:
            if cmd[0] == "setex":
                await self._redis.setex(cmd[1], cmd[2], cmd[3])
        return [True] * len(self._commands)


@pytest.fixture
def mock_redis() -> MockRedis:
    """Create a mock Redis client."""
    return MockRedis()
