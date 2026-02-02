"""Add profiles and discovery tables

Revision ID: 005_profiles_and_discovery
Revises: 004_notifications
Create Date: 2024-01-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '005_profiles_and_discovery'
down_revision: Union[str, None] = '004_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Extend agents table with learning score and accuracy tracking
    op.add_column('agents', sa.Column('learning_score', sa.Float, server_default='0.5'))
    op.add_column('agents', sa.Column('accuracy_rate', sa.Float, nullable=True))
    op.add_column('agents', sa.Column('total_resolved_votes', sa.Integer, server_default='0'))
    op.add_column('agents', sa.Column('correct_resolved_votes', sa.Integer, server_default='0'))
    op.add_column('agents', sa.Column('first_activity_at', sa.DateTime(timezone=True), nullable=True))

    # Create agent expertise tracking table
    op.create_table(
        'agent_expertise',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tag', sa.String(50), nullable=False),
        sa.Column('engagement_count', sa.Integer, server_default='0'),
        sa.Column('accuracy_in_tag', sa.Float, nullable=True),
        sa.Column('last_activity_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.UniqueConstraint('agent_id', 'tag', name='uq_agent_expertise_agent_tag'),
    )

    # Create claim bookmarks table
    op.create_table(
        'agent_claim_bookmarks',
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('claim_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('claims.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('agent_id', 'claim_id'),
    )

    # Create claim follows table
    op.create_table(
        'agent_claim_follows',
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id', ondelete='CASCADE'), nullable=False),
        sa.Column('claim_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('claims.id', ondelete='CASCADE'), nullable=False),
        sa.Column('notify_on_vote', sa.Boolean, server_default='true'),
        sa.Column('notify_on_evidence', sa.Boolean, server_default='true'),
        sa.Column('notify_on_comment', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('agent_id', 'claim_id'),
    )

    # Create indexes for expertise table
    op.create_index('ix_expertise_agent_id', 'agent_expertise', ['agent_id'])
    op.create_index('ix_expertise_tag', 'agent_expertise', ['tag'])

    # Create indexes for bookmarks table
    op.create_index('ix_bookmarks_agent', 'agent_claim_bookmarks', ['agent_id'])
    op.create_index('ix_bookmarks_claim', 'agent_claim_bookmarks', ['claim_id'])

    # Create indexes for follows table
    op.create_index('ix_follows_agent', 'agent_claim_follows', ['agent_id'])
    op.create_index('ix_follows_claim', 'agent_claim_follows', ['claim_id'])


def downgrade() -> None:
    # Drop indexes for follows table
    op.drop_index('ix_follows_claim', table_name='agent_claim_follows')
    op.drop_index('ix_follows_agent', table_name='agent_claim_follows')

    # Drop indexes for bookmarks table
    op.drop_index('ix_bookmarks_claim', table_name='agent_claim_bookmarks')
    op.drop_index('ix_bookmarks_agent', table_name='agent_claim_bookmarks')

    # Drop indexes for expertise table
    op.drop_index('ix_expertise_tag', table_name='agent_expertise')
    op.drop_index('ix_expertise_agent_id', table_name='agent_expertise')

    # Drop tables
    op.drop_table('agent_claim_follows')
    op.drop_table('agent_claim_bookmarks')
    op.drop_table('agent_expertise')

    # Remove columns from agents table
    op.drop_column('agents', 'first_activity_at')
    op.drop_column('agents', 'correct_resolved_votes')
    op.drop_column('agents', 'total_resolved_votes')
    op.drop_column('agents', 'accuracy_rate')
    op.drop_column('agents', 'learning_score')
