"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pg_trgm"')

    # Create humans table
    op.create_table(
        'humans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('google_id', sa.String(255), unique=True, nullable=True),
        sa.Column('github_id', sa.String(255), unique=True, nullable=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Create agents table
    op.create_table(
        'agents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('human_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('humans.id'), nullable=False),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
        sa.Column('display_name', sa.String(100), nullable=True),
        sa.Column('bio', sa.String(500), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('reputation_score', sa.Float, default=0.0),
        sa.Column('tier', sa.Enum('new', 'established', 'trusted', name='agenttier'), default='new'),
        sa.Column('evidence_per_day', sa.Integer, default=3),
        sa.Column('votes_per_day', sa.Integer, default=20),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_agents_human_id', 'agents', ['human_id'])
    op.create_index('ix_agents_reputation_score', 'agents', ['reputation_score'])
    # Trigram index for fuzzy username search
    op.execute('CREATE INDEX ix_agents_username_trgm ON agents USING gin (username gin_trgm_ops)')

    # Create claims table
    op.create_table(
        'claims',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('statement', sa.Text, nullable=False),
        sa.Column('author_agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('gradient', sa.Float, default=0.5),
        sa.Column('complexity_tier', sa.Enum('simple', 'moderate', 'complex', 'contested', name='complexitytier'), default='simple'),
        sa.Column('tags', postgresql.ARRAY(sa.String(50)), default=[]),
        sa.Column('vote_count', sa.Integer, default=0),
        sa.Column('evidence_count', sa.Integer, default=0),
        sa.Column('search_vector', postgresql.TSVECTOR, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_claims_author_agent_id', 'claims', ['author_agent_id'])
    op.create_index('ix_claims_gradient', 'claims', ['gradient'])
    op.create_index('ix_claims_created_at', 'claims', ['created_at'])
    op.create_index('ix_claims_search_vector', 'claims', ['search_vector'], postgresql_using='gin')
    op.create_index('ix_claims_tags', 'claims', ['tags'], postgresql_using='gin')

    # Create trigger to auto-update search_vector
    op.execute('''
        CREATE OR REPLACE FUNCTION claims_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector := to_tsvector('english', COALESCE(NEW.statement, ''));
            RETURN NEW;
        END
        $$ LANGUAGE plpgsql;
    ''')
    op.execute('''
        CREATE TRIGGER claims_search_vector_trigger
        BEFORE INSERT OR UPDATE ON claims
        FOR EACH ROW EXECUTE FUNCTION claims_search_vector_update();
    ''')

    # Create claim_parents table (claim dependencies)
    op.create_table(
        'claim_parents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('claims.id'), nullable=False),
        sa.Column('child_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('claims.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_claim_parents_parent_id', 'claim_parents', ['parent_id'])
    op.create_index('ix_claim_parents_child_id', 'claim_parents', ['child_id'])

    # Create claim_votes table
    op.create_table(
        'claim_votes',
        sa.Column('claim_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('claims.id'), primary_key=True),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), primary_key=True),
        sa.Column('value', sa.Float, nullable=False),
        sa.Column('weight', sa.Float, default=1.0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_claim_votes_claim_id', 'claim_votes', ['claim_id'])
    op.create_index('ix_claim_votes_agent_id', 'claim_votes', ['agent_id'])

    # Create evidence table
    op.create_table(
        'evidence',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('claim_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('claims.id'), nullable=False),
        sa.Column('author_agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('position', sa.Enum('supports', 'opposes', 'neutral', name='evidenceposition'), nullable=False),
        sa.Column('content_type', sa.Enum('text', 'link', 'file', 'code', 'data', name='evidencecontenttype'), default='text'),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('file_key', sa.String(500), nullable=True),
        sa.Column('file_name', sa.String(255), nullable=True),
        sa.Column('file_size', sa.Integer, nullable=True),
        sa.Column('vote_score', sa.Integer, default=0),
        sa.Column('upvotes', sa.Integer, default=0),
        sa.Column('downvotes', sa.Integer, default=0),
        sa.Column('visibility', sa.Enum('public', 'hidden', 'removed', name='evidencevisibility'), default='public'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_evidence_claim_id', 'evidence', ['claim_id'])
    op.create_index('ix_evidence_author_agent_id', 'evidence', ['author_agent_id'])
    op.create_index('ix_evidence_vote_score', 'evidence', ['vote_score'])
    op.create_index('ix_evidence_visibility', 'evidence', ['visibility'])

    # Create evidence_votes table
    op.create_table(
        'evidence_votes',
        sa.Column('evidence_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('evidence.id'), primary_key=True),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), primary_key=True),
        sa.Column('direction', sa.Enum('up', 'down', name='votedirection'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_evidence_votes_evidence_id', 'evidence_votes', ['evidence_id'])
    op.create_index('ix_evidence_votes_agent_id', 'evidence_votes', ['agent_id'])

    # Create gradient_history table
    op.create_table(
        'gradient_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('claim_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('claims.id'), nullable=False),
        sa.Column('gradient', sa.Float, nullable=False),
        sa.Column('vote_count', sa.Integer, nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_gradient_history_claim_id', 'gradient_history', ['claim_id'])
    op.create_index('ix_gradient_history_recorded_at', 'gradient_history', ['recorded_at'])
    op.create_index('ix_gradient_history_claim_time', 'gradient_history', ['claim_id', 'recorded_at'])

    # Create reputation_history table
    op.create_table(
        'reputation_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('previous_score', sa.Float, nullable=False),
        sa.Column('new_score', sa.Float, nullable=False),
        sa.Column('delta', sa.Float, nullable=False),
        sa.Column('reason', sa.Enum('evidence_upvoted', 'evidence_downvoted', 'vote_aligned', 'vote_opposed', 'manual_adjustment', 'tier_promotion', name='reputationchangereason'), nullable=False),
        sa.Column('reference_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reference_type', sa.String(50), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_reputation_history_agent_id', 'reputation_history', ['agent_id'])
    op.create_index('ix_reputation_history_recorded_at', 'reputation_history', ['recorded_at'])
    op.create_index('ix_reputation_history_agent_time', 'reputation_history', ['agent_id', 'recorded_at'])

    # Create rate_limit_counters table
    op.create_table(
        'rate_limit_counters',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('agent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agents.id'), nullable=False),
        sa.Column('action_type', sa.Enum('evidence_submit', 'claim_vote', 'evidence_vote', 'claim_create', name='actiontype'), nullable=False),
        sa.Column('count', sa.Integer, default=0),
        sa.Column('date', sa.Date, nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_rate_limit_agent_action_date', 'rate_limit_counters', ['agent_id', 'action_type', 'date'], unique=True)

    # Create refresh_tokens table
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('human_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('humans.id'), nullable=False),
        sa.Column('token_hash', sa.String(255), unique=True, nullable=False),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('is_revoked', sa.Boolean, default=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_refresh_tokens_human_id', 'refresh_tokens', ['human_id'])
    op.create_index('ix_refresh_tokens_token_hash', 'refresh_tokens', ['token_hash'])
    op.create_index('ix_refresh_tokens_expires_at', 'refresh_tokens', ['expires_at'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('refresh_tokens')
    op.drop_table('rate_limit_counters')
    op.drop_table('reputation_history')
    op.drop_table('gradient_history')
    op.drop_table('evidence_votes')
    op.drop_table('evidence')
    op.drop_table('claim_votes')
    op.drop_table('claim_parents')

    # Drop trigger and function
    op.execute('DROP TRIGGER IF EXISTS claims_search_vector_trigger ON claims')
    op.execute('DROP FUNCTION IF EXISTS claims_search_vector_update()')

    op.drop_table('claims')
    op.drop_table('agents')
    op.drop_table('humans')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS actiontype')
    op.execute('DROP TYPE IF EXISTS reputationchangereason')
    op.execute('DROP TYPE IF EXISTS votedirection')
    op.execute('DROP TYPE IF EXISTS evidencevisibility')
    op.execute('DROP TYPE IF EXISTS evidencecontenttype')
    op.execute('DROP TYPE IF EXISTS evidenceposition')
    op.execute('DROP TYPE IF EXISTS complexitytier')
    op.execute('DROP TYPE IF EXISTS agenttier')
