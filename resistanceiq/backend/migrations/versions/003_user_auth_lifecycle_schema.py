"""User Auth & Lifecycle Schema

Revision ID: 003_user_auth_lifecycle_schema
Revises: 002_data_ingestion_schema
Create Date: 2026-08-18 23:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column

revision: str = '003_user_auth_lifecycle_schema'
down_revision: Union[str, None] = '002_data_ingestion_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add columns and indexes using batch_alter_table for SQLite/PostgreSQL cross-compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('first_name', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('last_name', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('email_verified', sa.Boolean(), server_default='0', nullable=False))
        batch_op.add_column(sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('password_reset_token', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('password_reset_expires_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('invitation_token', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('invitation_expires_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index('ix_users_password_reset_token', ['password_reset_token'], unique=False)
        batch_op.create_index('ix_users_invitation_token', ['invitation_token'], unique=False)

    # Data migration: Populate first_name and last_name from full_name if available, and set email_verified for admins
    users_table = table(
        'users',
        column('id', sa.String),
        column('full_name', sa.String),
        column('first_name', sa.String),
        column('last_name', sa.String),
        column('email_verified', sa.Boolean),
        column('role', sa.String),
    )
    
    conn = op.get_bind()
    results = conn.execute(sa.select(users_table.c.id, users_table.c.full_name, users_table.c.role)).fetchall()
    for row in results:
        user_id = row[0]
        full_name = row[1] or ""
        role = row[2] or ""
        
        parts = full_name.strip().split(" ", 1)
        first_name = parts[0] if len(parts) > 0 else None
        last_name = parts[1] if len(parts) > 1 else None
        is_verified = (role == "ADMIN")
        
        conn.execute(
            users_table.update().where(users_table.c.id == user_id).values(
                first_name=first_name,
                last_name=last_name,
                email_verified=is_verified,
            )
        )


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index('ix_users_invitation_token')
        batch_op.drop_index('ix_users_password_reset_token')
        batch_op.drop_column('invitation_expires_at')
        batch_op.drop_column('invitation_token')
        batch_op.drop_column('password_reset_expires_at')
        batch_op.drop_column('password_reset_token')
        batch_op.drop_column('last_login_at')
        batch_op.drop_column('email_verified')
        batch_op.drop_column('last_name')
        batch_op.drop_column('first_name')
