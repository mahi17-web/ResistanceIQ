"""Production Auth, RBAC, and Audit Logs Schema

Revision ID: 005_production_auth_rbac_audit_schema
Revises: 004_knowledge_graph_schema
Create Date: 2026-08-19 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '005_production_auth_rbac_audit_schema'
down_revision: Union[str, None] = '004_knowledge_graph_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update users table with display_name and email_verification columns
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('display_name', sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column('email_verification_token', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('email_verification_expires_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index('ix_users_email_verification_token', ['email_verification_token'], unique=False)

    # 2. Update activity_logs table with audit metadata columns
    with op.batch_alter_table('activity_logs', schema=None) as batch_op:
        batch_op.add_column(sa.Column('organization_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('event_type', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('resource_type', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('resource_id', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('ip_address', sa.String(length=45), nullable=True))
        batch_op.add_column(sa.Column('user_agent', sa.String(length=255), nullable=True))
        batch_op.create_index('ix_activity_logs_organization_id', ['organization_id'], unique=False)
        batch_op.create_index('ix_activity_logs_event_type', ['event_type'], unique=False)
        batch_op.create_index('ix_activity_logs_action', ['action'], unique=False)
        batch_op.create_index('ix_activity_logs_created_at', ['created_at'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('activity_logs', schema=None) as batch_op:
        batch_op.drop_index('ix_activity_logs_created_at')
        batch_op.drop_index('ix_activity_logs_action')
        batch_op.drop_index('ix_activity_logs_event_type')
        batch_op.drop_index('ix_activity_logs_organization_id')
        batch_op.drop_column('user_agent')
        batch_op.drop_column('ip_address')
        batch_op.drop_column('resource_id')
        batch_op.drop_column('resource_type')
        batch_op.drop_column('event_type')
        batch_op.drop_column('organization_id')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('ix_users_email_verification_token')
        batch_op.drop_column('email_verification_expires_at')
        batch_op.drop_column('email_verification_token')
        batch_op.drop_column('display_name')
