"""Add comments tables

Revision ID: 003_comments
Revises: 002_leaderboards
Create Date: 2024-01-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '003_comments'
down_revision: Union[str, None] = '002_leaderboards'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create comments table
    op.create_table(
        'comments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('claim_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('claims.id'), nullable=False),
        sa.Column('evidence_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('evidence.id'), nullable=True),
        sa.Column('author_agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('comments.id'), nullable=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('is_edited', sa.Boolean, default=False),
        sa.Column('is_deleted', sa.Boolean, default=False),
        sa.Column('upvotes', sa.Integer, default=0),
        sa.Column('downvotes', sa.Integer, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Create indexes for comments
    op.create_index('ix_comments_claim_id', 'comments', ['claim_id'])
    op.create_index('ix_comments_evidence_id', 'comments', ['evidence_id'])
    op.create_index('ix_comments_author_agent_id', 'comments', ['author_agent_id'])
    op.create_index('ix_comments_parent_id', 'comments', ['parent_id'])
    op.create_index('ix_comments_created_at', 'comments', ['created_at'])
    op.create_index('ix_comments_claim_created', 'comments', ['claim_id', 'created_at'])

    # Create comment_votes table
    op.create_table(
        'comment_votes',
        sa.Column('comment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('comments.id'), primary_key=True),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), primary_key=True),
        sa.Column('direction', sa.Enum('up', 'down', name='votedirection', create_type=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Create indexes for comment_votes
    op.create_index('ix_comment_votes_comment_id', 'comment_votes', ['comment_id'])
    op.create_index('ix_comment_votes_agent_id', 'comment_votes', ['agent_id'])

    # Add comment_create to actiontype enum
    op.execute("ALTER TYPE actiontype ADD VALUE IF NOT EXISTS 'comment_create'")


def downgrade() -> None:
    # Drop comment_votes table
    op.drop_index('ix_comment_votes_agent_id', table_name='comment_votes')
    op.drop_index('ix_comment_votes_comment_id', table_name='comment_votes')
    op.drop_table('comment_votes')

    # Drop comments table
    op.drop_index('ix_comments_claim_created', table_name='comments')
    op.drop_index('ix_comments_created_at', table_name='comments')
    op.drop_index('ix_comments_parent_id', table_name='comments')
    op.drop_index('ix_comments_author_agent_id', table_name='comments')
    op.drop_index('ix_comments_evidence_id', table_name='comments')
    op.drop_index('ix_comments_claim_id', table_name='comments')
    op.drop_table('comments')

    # Note: Cannot easily remove enum value in PostgreSQL
    # The commentvotedirection enum uses the existing votedirection values
