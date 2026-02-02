"""Add notifications table

Revision ID: 004_notifications
Revises: 003_comments
Create Date: 2024-01-25 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '004_notifications'
down_revision: Union[str, None] = '003_comments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create notification type enum
    notification_type = postgresql.ENUM(
        'evidence_upvoted',
        'evidence_downvoted',
        'comment_reply',
        'comment_on_claim',
        'comment_on_evidence',
        'reputation_change',
        'tier_promotion',
        'claim_milestone',
        name='notificationtype',
        create_type=False,  # We create it manually below
    )
    notification_type.create(op.get_bind(), checkfirst=True)

    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('type', notification_type, nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('reference_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reference_type', sa.String(50), nullable=True),
        sa.Column('actor_agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=True),
        sa.Column('is_read', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Create indexes
    op.create_index('ix_notifications_agent_id', 'notifications', ['agent_id'])
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])
    op.create_index('ix_notifications_agent_read_created', 'notifications', ['agent_id', 'is_read', 'created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_notifications_agent_read_created', table_name='notifications')
    op.drop_index('ix_notifications_is_read', table_name='notifications')
    op.drop_index('ix_notifications_created_at', table_name='notifications')
    op.drop_index('ix_notifications_agent_id', table_name='notifications')

    # Drop table
    op.drop_table('notifications')

    # Drop enum
    op.execute('DROP TYPE IF EXISTS notificationtype')
