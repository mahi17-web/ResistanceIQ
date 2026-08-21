"""Initial schema for ResistanceIQ entities

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-18 21:50:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. organizations
    op.create_table(
        'organizations',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('slug', sa.String(length=128), unique=True, nullable=False),
        sa.Column('plan_tier', sa.String(length=32), server_default='PRO'),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_organizations_slug', 'organizations', ['slug'], unique=True)

    # 2. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('organization_id', sa.String(length=36), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('email', sa.String(length=255), unique=True, nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=128), nullable=False),
        sa.Column('role', sa.String(length=32), nullable=False, server_default='ANALYST'),
        sa.Column('is_active', sa.Boolean(), server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # 3. projects
    op.create_table(
        'projects',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('organization_id', sa.String(length=36), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='ACTIVE'),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )

    # 4. molecules
    op.create_table(
        'molecules',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('chemical_name', sa.String(length=255), nullable=False),
        sa.Column('smiles', sa.Text(), nullable=False),
        sa.Column('molecular_weight', sa.Float(), nullable=True),
        sa.Column('logp', sa.Float(), nullable=True),
        sa.Column('hbd_count', sa.Integer(), nullable=True),
        sa.Column('hba_count', sa.Integer(), nullable=True),
        sa.Column('provenance_source', sa.String(length=64), server_default='USER_UPLOAD'),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    # 5. targets
    op.create_table(
        'targets',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('uniprot_id', sa.String(length=32), nullable=False),
        sa.Column('organism', sa.String(length=128), nullable=False),
        sa.Column('structure_source', sa.String(length=64), server_default='ESMFold'),
        sa.Column('binding_pocket_residues', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    # 6. pests
    op.create_table(
        'pests',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('common_name', sa.String(length=128), nullable=False),
        sa.Column('species_name', sa.String(length=128), nullable=False),
        sa.Column('generation_time_days', sa.Integer(), nullable=False),
        sa.Column('typical_population_size', sa.BigInteger(), nullable=False),
        sa.Column('baseline_mutation_rate', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    # 7. forecasts
    op.create_table(
        'forecasts',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('project_id', sa.String(length=36), sa.ForeignKey('projects.id'), nullable=False),
        sa.Column('molecule_id', sa.String(length=36), sa.ForeignKey('molecules.id'), nullable=False),
        sa.Column('target_id', sa.String(length=36), sa.ForeignKey('targets.id'), nullable=False),
        sa.Column('pest_id', sa.String(length=36), sa.ForeignKey('pests.id'), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('durability_score', sa.Float(), nullable=True),
        sa.Column('estimated_years_to_resistance', sa.Float(), nullable=True),
        sa.Column('risk_tier', sa.String(length=32), nullable=True),
        sa.Column('binding_affinity_kcal_mol', sa.Float(), nullable=True),
        sa.Column('risk_trajectory_json', sa.Text(), nullable=True),
        sa.Column('mutagenesis_hotspots_json', sa.Text(), nullable=True),
        sa.Column('model_version', sa.String(length=32), server_default='v0.3-mvp'),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 8. backtest_cases
    op.create_table(
        'backtest_cases',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('pesticide_name', sa.String(length=128), nullable=False),
        sa.Column('aprd_id', sa.String(length=32), nullable=False),
        sa.Column('pest_name', sa.String(length=128), nullable=False),
        sa.Column('target_name', sa.String(length=128), nullable=False),
        sa.Column('deployment_year', sa.Integer(), nullable=False),
        sa.Column('actual_years', sa.Float(), nullable=False),
        sa.Column('predicted_years', sa.Float(), nullable=False),
        sa.Column('error_margin', sa.Float(), nullable=False),
        sa.Column('source', sa.String(length=32), server_default='APRD'),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    # 9. reports
    op.create_table(
        'reports',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('project_id', sa.String(length=36), sa.ForeignKey('projects.id'), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('format', sa.String(length=16), nullable=False, server_default='PDF'),
        sa.Column('size_kb', sa.Integer(), server_default='120'),
        sa.Column('storage_path', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    # 10. api_keys
    op.create_table(
        'api_keys',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('organization_id', sa.String(length=36), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('key_prefix', sa.String(length=16), nullable=False),
        sa.Column('hashed_key', sa.String(length=255), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    # 11. activity_logs
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('user_id', sa.String(length=36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )


def downgrade() -> None:
    op.drop_table('activity_logs')
    op.drop_table('api_keys')
    op.drop_table('reports')
    op.drop_table('backtest_cases')
    op.drop_table('forecasts')
    op.drop_table('pests')
    op.drop_table('targets')
    op.drop_table('molecules')
    op.drop_table('projects')
    op.drop_table('users')
    op.drop_table('organizations')
