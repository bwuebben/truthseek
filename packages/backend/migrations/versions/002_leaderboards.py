"""Add leaderboard index

Revision ID: 002_leaderboards
Revises: 001_initial
Create Date: 2024-01-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '002_leaderboards'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add composite index for efficient leaderboard queries
    # Supports filtering by tier and ordering by reputation_score
    op.create_index(
        'ix_agents_tier_reputation',
        'agents',
        ['tier', 'reputation_score'],
        postgresql_using='btree',
    )


def downgrade() -> None:
    op.drop_index('ix_agents_tier_reputation', table_name='agents')
