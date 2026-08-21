"""Data Ingestion & Provenance Schema

Revision ID: 002_data_ingestion_schema
Revises: 001_initial_schema
Create Date: 2026-08-18 22:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_data_ingestion_schema'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. data_sources
    op.create_table(
        'data_sources',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('organization', sa.String(length=128), nullable=False),
        sa.Column('url', sa.String(length=512), nullable=False),
        sa.Column('license', sa.String(length=128), nullable=False),
        sa.Column('access_method', sa.String(length=64), nullable=False),
        sa.Column('source_type', sa.String(length=64), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
    )

    # 2. dataset_versions
    op.create_table(
        'dataset_versions',
        sa.Column('id', sa.String(length=64), primary_key=True),
        sa.Column('data_source_id', sa.String(length=64), sa.ForeignKey('data_sources.id'), nullable=False),
        sa.Column('dataset_name', sa.String(length=128), nullable=False),
        sa.Column('version', sa.String(length=32), nullable=False),
        sa.Column('retrieved_at', sa.DateTime(timezone=True)),
        sa.Column('checksum', sa.String(length=64), nullable=False),
        sa.Column('record_count', sa.Integer(), server_default='0'),
        sa.Column('status', sa.String(length=32), server_default='ACTIVE'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    # 3. ingestion_runs
    op.create_table(
        'ingestion_runs',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('dataset_version_id', sa.String(length=64), sa.ForeignKey('dataset_versions.id'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False, server_default='PENDING'),
        sa.Column('records_seen', sa.Integer(), server_default='0'),
        sa.Column('records_accepted', sa.Integer(), server_default='0'),
        sa.Column('records_rejected', sa.Integer(), server_default='0'),
        sa.Column('error_count', sa.Integer(), server_default='0'),
        sa.Column('log_location', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )

    # 4. canonical_organisms
    op.create_table(
        'canonical_organisms',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('original_name', sa.String(length=255), nullable=False),
        sa.Column('canonical_name', sa.String(length=255), nullable=False),
        sa.Column('scientific_name', sa.String(length=255), nullable=False),
        sa.Column('common_name', sa.String(length=255), nullable=True),
        sa.Column('genus', sa.String(length=128), nullable=True),
        sa.Column('species', sa.String(length=128), nullable=True),
        sa.Column('family', sa.String(length=128), nullable=True),
        sa.Column('order', sa.String(length=128), nullable=True),
        sa.Column('ncbi_taxid', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_canonical_organisms_canonical_name', 'canonical_organisms', ['canonical_name'])

    # 5. canonical_pesticides
    op.create_table(
        'canonical_pesticides',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('original_name', sa.String(length=255), nullable=False),
        sa.Column('active_ingredient', sa.String(length=255), nullable=False),
        sa.Column('cas_number', sa.String(length=32), nullable=True),
        sa.Column('irac_moa_group', sa.String(length=16), nullable=True),
        sa.Column('chemical_class', sa.String(length=128), nullable=True),
        sa.Column('source_identifier', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_canonical_pesticides_active_ingredient', 'canonical_pesticides', ['active_ingredient'])

    # 6. resistance_cases
    op.create_table(
        'resistance_cases',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('organism_id', sa.String(length=36), sa.ForeignKey('canonical_organisms.id'), nullable=False),
        sa.Column('pesticide_id', sa.String(length=36), sa.ForeignKey('canonical_pesticides.id'), nullable=False),
        sa.Column('resistance_year', sa.Integer(), nullable=True),
        sa.Column('publication_year', sa.Integer(), nullable=True),
        sa.Column('country', sa.String(length=64), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('resistance_type', sa.String(length=128), nullable=True),
        sa.Column('source_id', sa.String(length=64), sa.ForeignKey('data_sources.id'), nullable=False),
        sa.Column('source_record_id', sa.String(length=128), nullable=False),
        sa.Column('reference', sa.Text(), nullable=True),
        sa.Column('bioassay_method', sa.String(length=128), nullable=True),
        sa.Column('resistance_ratio', sa.Float(), nullable=True),
        sa.Column('susceptible_baseline', sa.Float(), nullable=True),
        sa.Column('is_duplicate_candidate', sa.Boolean(), server_default='0'),
        sa.Column('dataset_version_id', sa.String(length=64), sa.ForeignKey('dataset_versions.id'), nullable=False),
        sa.Column('ingestion_run_id', sa.String(length=36), sa.ForeignKey('ingestion_runs.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_resistance_cases_source_record_id', 'resistance_cases', ['source_record_id'])
    op.create_index('ix_resistance_cases_resistance_year', 'resistance_cases', ['resistance_year'])

    # 7. data_quality_rejections
    op.create_table(
        'data_quality_rejections',
        sa.Column('id', sa.String(length=36), primary_key=True),
        sa.Column('ingestion_run_id', sa.String(length=36), sa.ForeignKey('ingestion_runs.id'), nullable=False),
        sa.Column('source_record_id', sa.String(length=128), nullable=True),
        sa.Column('raw_payload', sa.Text(), nullable=False),
        sa.Column('rejection_reason', sa.String(length=255), nullable=False),
        sa.Column('error_code', sa.String(length=64), nullable=False),
        sa.Column('stage', sa.String(length=32), server_default='VALIDATION'),
        sa.Column('rejected_at', sa.DateTime(timezone=True)),
    )
    op.create_index('ix_data_quality_rejections_error_code', 'data_quality_rejections', ['error_code'])


def downgrade() -> None:
    op.drop_table('data_quality_rejections')
    op.drop_table('resistance_cases')
    op.drop_table('canonical_pesticides')
    op.drop_table('canonical_organisms')
    op.drop_table('ingestion_runs')
    op.drop_table('dataset_versions')
    op.drop_table('data_sources')
